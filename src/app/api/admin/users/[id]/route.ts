import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  tier:                     z.enum(['free', 'pro', 'enterprise']).optional(),
  is_banned:                z.boolean().optional(),
  feature_flags:            z.record(z.string(), z.boolean()).optional(),
  // Pro-User "Geschenk": höheres KI-Tageslimit als der globale Default.
  // null setzt den Override zurück (globaler Default greift wieder).
  ai_daily_limit_override:  z.number().int().min(1).max(500).nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Auth check via session client (RLS applied — reads own profile only)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!admin?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { ai_daily_limit_override, feature_flags, ...rest } = parsed.data

  // Service-role client bypasses RLS for cross-user update
  const adminClient = await createAdminClient()

  const update: Record<string, unknown> = { ...rest }

  if (feature_flags !== undefined || ai_daily_limit_override !== undefined) {
    // feature_flags ist JSONB — nicht überschreiben, sondern mergen, damit
    // andere bereits gesetzte Flags (oder der Limit-Override) nicht durch
    // ein Partial-Update aus dem Admin-Panel verloren gehen.
    const { data: existing, error: fetchError } = await adminClient
      .from('profiles')
      .select('feature_flags')
      .eq('id', id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const merged: Record<string, unknown> = { ...(existing?.feature_flags as Record<string, unknown> ?? {}) }
    if (feature_flags !== undefined) Object.assign(merged, feature_flags)
    if (ai_daily_limit_override !== undefined) {
      if (ai_daily_limit_override === null) delete merged.ai_daily_limit_override
      else merged.ai_daily_limit_override = ai_daily_limit_override
    }
    update.feature_flags = merged
  }

  const { data, error } = await adminClient
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('id, email, full_name, tier, is_banned, feature_flags')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
