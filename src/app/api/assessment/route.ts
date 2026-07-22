import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'

// Draft-Autosave für das Assessment (UX-Review Sprint 35, 22.07.2026): Beim
// Wizard-Start wird eine Draft-Zeile (completed=false) angelegt, damit
// Zwischenstände serverseitig überleben (Tab schließen, Verbindungsabbruch).
// Pro-gated wie das Speichern des Endergebnisses (save_results) — Free-Nutzer
// persistieren gar nicht, für sie bleibt der Wizard wie bisher ephemer.
const CreateSchema = z.object({
  type: z.enum(['quick', 'deep']).default('deep'),
})

export async function POST(req: Request) {
  const gate = await requireFeature('save_results')
  if (gate instanceof NextResponse) return gate

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body ?? {})
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 422 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assessment_sessions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ user_id: gate.userId, type: parsed.data.type, answers: {}, completed: false } as any)
    .select('id')
    .single() as { data: { id: string } | null; error: { message: string } | null }

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Anlegen fehlgeschlagen' }, { status: 500 })
  return NextResponse.json({ data: { id: data.id } })
}
