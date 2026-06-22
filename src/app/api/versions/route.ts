import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SaveVersionSchema = z.object({
  module: z.string().min(1).max(50),
  entity_id: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
  label: z.string().max(100).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const module = searchParams.get('module')
  const entity_id = searchParams.get('entity_id')

  if (!module || !entity_id) {
    return NextResponse.json({ error: 'module und entity_id erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('result_versions')
    .select('id, version_no, label, created_at, data')
    .eq('user_id', user.id)
    .eq('module', module)
    .eq('entity_id', entity_id)
    .order('version_no', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('tier').eq('id', user.id).single()
  if (profile?.tier !== 'pro' && profile?.tier !== 'enterprise') {
    return NextResponse.json({ error: 'Pro-Feature' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = SaveVersionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { module, entity_id, data, label } = parsed.data

  const { data: lastVersion } = await supabase
    .from('result_versions')
    .select('version_no')
    .eq('entity_id', entity_id)
    .order('version_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  const version_no = (lastVersion?.version_no ?? 0) + 1

  const { data: version, error } = await supabase
    .from('result_versions')
    .insert({ user_id: user.id, module, entity_id, version_no, data, label })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: version })
}
