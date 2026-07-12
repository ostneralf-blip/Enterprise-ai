import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { invalidateSettingsCache } from '@/lib/app-settings'
import { z } from 'zod'

const ALLOWED_KEYS = ['ai_limit_free', 'ai_limit_pro', 'ai_limit_enterprise', 'stripe_grace_period_days'] as const
type SettingKey = typeof ALLOWED_KEYS[number]

export interface AppSettingsData {
  ai_limit_free: number
  ai_limit_pro: number
  ai_limit_enterprise: number
  stripe_grace_period_days: number
}

const PatchSchema = z.object({
  ai_limit_free:            z.number().int().min(0).max(1000).optional(),
  ai_limit_pro:             z.number().int().min(0).max(1000).optional(),
  ai_limit_enterprise:      z.number().int().min(0).max(1000).optional(),
  stripe_grace_period_days: z.number().int().min(0).max(90).optional(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('profiles') as any).select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const supabase = await createAdminClient()
  const { data } = await supabase.from('app_settings').select('key, value').in('key', ALLOWED_KEYS)

  const defaults: AppSettingsData = { ai_limit_free: 1, ai_limit_pro: 10, ai_limit_enterprise: 50, stripe_grace_period_days: 7 }
  const result = { ...defaults }
  for (const row of data ?? []) {
    const k = row.key as SettingKey
    if (ALLOWED_KEYS.includes(k)) result[k] = Number(row.value)
  }
  return NextResponse.json(result)
}

export async function PATCH(req: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = PatchSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Ungültige Werte' }, { status: 400 })

  const supabase = await createAdminClient()
  const updates = Object.entries(body.data).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  invalidateSettingsCache()
  return NextResponse.json({ ok: true })
}
