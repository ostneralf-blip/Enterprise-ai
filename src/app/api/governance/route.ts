import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SaveSchema = z.object({
  use_case_name: z.string().max(200).nullable().optional(),
  use_case_id:   z.string().uuid().nullable().optional(),
  use_case_ids:  z.array(z.string().uuid()).optional().default([]),
  answers:       z.record(z.string(), z.string()),
  result:        z.enum(['approve', 'stop_dsgvo', 'stop_risk', 'improve']),
  protocol:      z.array(z.unknown()).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('governance_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = SaveSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('governance_sessions')
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Result auf alle verknüpften Use Cases zurückschreiben
  const allIds = [
    ...(parsed.data.use_case_id ? [parsed.data.use_case_id] : []),
    ...(parsed.data.use_case_ids ?? []),
  ]
  const uniqueIds = [...new Set(allIds)]
  if (uniqueIds.length > 0) {
    await supabase
      .from('use_cases')
      .update({ governance_result: parsed.data.result })
      .in('id', uniqueIds)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ data })
}
