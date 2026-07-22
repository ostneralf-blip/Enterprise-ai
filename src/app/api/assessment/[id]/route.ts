import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('assessment_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH: inkrementelles Draft-Update (nur answers) ODER Finalisierung
// (completed=true + berechnete Scores). Ersetzt den früheren client-direkten
// Insert im AssessmentPageClient — die Persistenz läuft jetzt server-seitig
// über die Draft-Zeile (UX-Review Sprint 35, 22.07.2026). Pro-gated
// (save_results) + Eigentumsprüfung über user_id.
const AnswersSchema = z.record(z.string().max(50), z.number().int().min(1).max(5))

const PatchSchema = z.object({
  answers: AnswersSchema,
  completed: z.boolean().optional(),
  total_score: z.number().min(0).max(5).optional(),
  dim_scores: z.record(z.string().max(50), z.number()).optional(),
  archetype: z.enum(['starter', 'scaler', 'transformer']).optional(),
}).refine(
  // Bei Finalisierung müssen die Score-Felder vorhanden sein.
  d => !d.completed || (d.total_score !== undefined && d.dim_scores !== undefined && d.archetype !== undefined),
  { message: 'Finalisierung erfordert total_score, dim_scores und archetype' }
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireFeature('save_results')
  if (gate instanceof NextResponse) return gate

  const body = await req.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 422 })

  const { answers, completed, total_score, dim_scores, archetype } = parsed.data
  const update: Record<string, unknown> = { answers }
  if (completed) {
    update.completed = true
    update.total_score = total_score
    update.dim_scores = dim_scores
    update.archetype = archetype
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assessment_sessions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(update as any)
    .eq('id', id)
    .eq('user_id', gate.userId)
    .select('id')
    .maybeSingle() as { data: { id: string } | null; error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Kein Treffer = fremde/nicht existente id (Eigentumsprüfung greift via user_id).
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json({ data: { id: data.id } })
}
