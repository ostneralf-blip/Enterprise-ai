import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getTier } from '@/lib/utils/tier-check'
import { enforceSaveQuota } from '@/lib/tier/save-quota'

const SaveSchema = z.object({
  title:     z.string().min(1).max(200).optional(),
  archetype: z.enum(['starter', 'scaler', 'transformer']),
  phases:    z.array(z.unknown()),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ roadmaps: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = SaveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Free-Tageslimit fürs Speichern einer neuen Roadmap (Issue #222).
  const limited = await enforceSaveQuota(user.id, await getTier(user.id), 'roadmap')
  if (limited) return limited

  const title = parsed.data.title ?? `Roadmap — ${new Date().toLocaleDateString('de-DE')}`

  const { data, error } = await supabase
    .from('roadmaps')
    .insert({ user_id: user.id, title, archetype: parsed.data.archetype, phases: parsed.data.phases })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
