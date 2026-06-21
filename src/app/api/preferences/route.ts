import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const uuidOrNull = z.string().uuid().nullable().optional()

const PreferencesSchema = z.object({
  primary_assessment_id:   uuidOrNull,
  primary_governance_id:   uuidOrNull,
  primary_roadmap_id:      uuidOrNull,
  primary_architecture_id: uuidOrNull,
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('user_preferences')
    .select('primary_assessment_id, primary_governance_id, primary_roadmap_id, primary_architecture_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ preferences: data ?? null })
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = PreferencesSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id' })
    .select('primary_assessment_id, primary_governance_id, primary_roadmap_id, primary_architecture_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
