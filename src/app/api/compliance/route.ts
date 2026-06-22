import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpsertSchema = z.object({
  regulation: z.enum(['eu_ai_act', 'dsgvo', 'risk_matrix']),
  check_type: z.string().min(1).max(100),
  status: z.enum(['pending', 'compliant', 'non_compliant', 'partial']),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('compliance_checks')
    .select('regulation, check_type, status, notes, completed_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at')

  return NextResponse.json({ checks: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { regulation, check_type, status, notes } = parsed.data
  const completed_at = status === 'compliant' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('compliance_checks')
    .upsert(
      { user_id: user.id, regulation, check_type, status, notes: notes ?? null, completed_at },
      { onConflict: 'user_id,regulation,check_type' }
    )
    .select('regulation, check_type, status, notes, completed_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
