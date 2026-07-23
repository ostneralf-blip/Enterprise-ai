import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRegulationSlugs } from '@/lib/compliance/db'
import { z } from 'zod'

// `regulation` ist entweder eine Regulierungs-Slug (aus der DB, seit #246) oder
// ein Sonder-Schlüssel: 'risk_matrix' (Risikomatrix-Position), 'system' (Meta-
// Zeile für aktivierte Zusatz-Regularien, check_type='active_regulations').
// Die konkrete Slug-Whitelist wird zur Laufzeit gegen compliance_regulations
// geprüft (siehe POST) — so werden neue Regularien (z. B. bdsg) automatisch
// erfasst, ohne dass ein statisches Enum nachgezogen werden muss.
const SPECIAL_REGULATIONS = ['risk_matrix', 'system'] as const
const UpsertSchema = z.object({
  regulation: z.string().min(1).max(50),
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

  // Whitelist zur Laufzeit: gültige Regulierungs-Slugs (DB) + Sonder-Schlüssel.
  const allowedRegulations = new Set<string>([...await getRegulationSlugs(), ...SPECIAL_REGULATIONS])
  if (!allowedRegulations.has(regulation)) {
    return NextResponse.json({ error: `Unbekannte Regulierung: ${regulation}` }, { status: 422 })
  }
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
