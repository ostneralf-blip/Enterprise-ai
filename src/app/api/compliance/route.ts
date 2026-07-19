import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADDITIONAL_REGULATIONS } from '@/config/compliance-data'
import { z } from 'zod'

// Bug gefunden 19.07.2026: dieses Enum ließ nur die drei ursprünglichen
// Regulation-Werte zu. CompliancePageClient.tsx speichert aber auch
// 'system' (Meta-Zeile für die Liste aktivierter "Weitere Regularien",
// check_type='active_regulations') und die IDs aus ADDITIONAL_REGULATIONS
// (z. B. 'nis2', 'iso_27001') für deren Checklisten-Items — jeder dieser
// Aufrufe scheiterte bisher an diesem Enum (422), ohne dass der Client den
// Fehler abfing (optimistisches UI-Update lief trotzdem durch). Betroffene
// Checkboxen wirkten gespeichert, waren es aber nie. IDs werden aus
// ADDITIONAL_REGULATIONS abgeleitet statt hartcodiert, damit künftig neue
// Regularien dort automatisch mit erfasst werden.
const UpsertSchema = z.object({
  regulation: z.enum(['eu_ai_act', 'dsgvo', 'risk_matrix', 'system', ...ADDITIONAL_REGULATIONS.map(r => r.id)] as [string, ...string[]]),
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
