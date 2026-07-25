import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// #261: Kopiert die inhaltlichen Nutzerdaten (Use Cases + Architekturen) in die
// historischen Tabellen, BEVOR ein Account gelöscht wird. Entscheidung Daniel
// (25.07.2026): "alles außer user_id" — Freitext bleibt erhalten. Anonymisiert
// wird auf Struktur-Ebene: es werden KEINE user_id/portfolio_id/canvas_id und
// keine Original-id übertragen (frische UUIDs vergibt die DB). Geschrieben wird
// über die Service-Role (RLS-Bypass); die historischen Tabellen sind für Nutzer
// per RLS gesperrt.
//
// Best-effort: wirft bei Fehlern, damit der Aufrufer sie loggen kann — die
// eigentliche Löschung darf dadurch NICHT blockiert werden (Recht auf Löschung
// hat Vorrang, siehe Aufrufer in api/account/delete).

interface UseCaseRow {
  name: string | null
  domain: string | null
  description: string | null
  scores: unknown
  weighted_score: number | null
  quadrant: string | null
  archetype: string | null
  created_at: string | null
}

interface ArchitectureRow {
  title: string | null
  wizard_data: unknown
  result: unknown
  ai_narrative: unknown
  narrative_locale: string | null
  created_at: string | null
}

export async function archiveUserData(
  admin: SupabaseClient,
  userId: string,
): Promise<{ useCases: number; architectures: number }> {
  // use_cases hat kein user_id, nur portfolio_id → erst die Portfolios des Nutzers laden.
  const { data: portfolios } = await admin.from('uc_portfolios').select('id').eq('user_id', userId)
  const portfolioIds = (portfolios ?? []).map((p: { id: string }) => p.id)

  let useCaseRows: UseCaseRow[] = []
  if (portfolioIds.length > 0) {
    const { data } = await admin
      .from('use_cases')
      .select('name, domain, description, scores, weighted_score, quadrant, archetype, created_at')
      .in('portfolio_id', portfolioIds)
    useCaseRows = (data ?? []) as UseCaseRow[]
  }

  const { data: archData } = await admin
    .from('architectures')
    .select('title, wizard_data, result, ai_narrative, narrative_locale, created_at')
    .eq('user_id', userId)
  const architectureRows = (archData ?? []) as ArchitectureRow[]

  // Mapping: bewusst NUR die inhaltlichen Felder — kein user_id/portfolio_id/id.
  const ucInsert = useCaseRows.map(r => ({
    name: r.name,
    domain: r.domain,
    description: r.description,
    scores: r.scores,
    weighted_score: r.weighted_score,
    quadrant: r.quadrant,
    archetype: r.archetype,
    original_created_at: r.created_at,
  }))
  const archInsert = architectureRows.map(r => ({
    title: r.title,
    wizard_data: r.wizard_data,
    result: r.result,
    ai_narrative: r.ai_narrative,
    narrative_locale: r.narrative_locale,
    original_created_at: r.created_at,
  }))

  if (ucInsert.length > 0) {
    const { error } = await admin.from('historical_use_cases').insert(ucInsert)
    if (error) throw new Error(`historical_use_cases insert: ${error.message}`)
  }
  if (archInsert.length > 0) {
    const { error } = await admin.from('historical_architectures').insert(archInsert)
    if (error) throw new Error(`historical_architectures insert: ${error.message}`)
  }

  return { useCases: ucInsert.length, architectures: archInsert.length }
}
