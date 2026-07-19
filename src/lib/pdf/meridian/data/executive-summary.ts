import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { ASSESSMENT_DIMENSIONS } from '@/config/assessment-data'
import { resolveLocaleField } from '@/lib/pdf/normalize-architecture'
import { loadEuAiActStatusV2 } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import type { EuAiActStatusSummary } from '@/lib/compliance/eu-ai-act-status-v1'
import type { Locale } from '@/i18n/routing'

// EuAiActStatusSummary wird hier re-exportiert, damit Konsumenten dieser
// Datenschicht (z. B. der Report) nicht wissen müssen, dass der Typ
// inzwischen in lib/compliance/eu-ai-act-status-v1.ts lebt (ausgelagert, um
// einen Zirkelbezug mit eu-ai-act-use-case-scoring.ts zu vermeiden, siehe
// Kommentar dort).
export type { EuAiActStatusSummary }

type MaybeLocale = string | { de: string; en: string }

export type QuadrantKey = 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'
export type Archetype = 'starter' | 'scaler' | 'transformer'
type GovernanceVerdict = 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'

export interface ExecutiveSummaryDimension {
  id: string
  label: string
  score100: number
}

export interface ExecutiveSummaryUseCase {
  name: string
  value100: number
  feasibility100: number
  quadrant: QuadrantKey | null
}

export interface ExecutiveSummaryData {
  companyName: string | null
  generatedAt: string
  overallScore100: number
  archetype: Archetype
  previousScore100: number | null
  dimensions: ExecutiveSummaryDimension[]
  topUseCases: ExecutiveSummaryUseCase[]
  euAiActStatus: EuAiActStatusSummary | null
  next90Days: string[]
}

const DIMENSION_SHORT_LABELS: Record<string, { de: string; en: string }> = {
  data:       { de: 'Daten',       en: 'Data' },
  skills:     { de: 'Skills',      en: 'Skills' },
  governance: { de: 'Governance',  en: 'Governance' },
  tech:       { de: 'Technologie', en: 'Technology' },
  strategy:   { de: 'Strategie',   en: 'Strategy' },
  culture:    { de: 'Kultur',      en: 'Culture' },
}

const score100 = (score5: number | null | undefined) =>
  Math.round(Math.max(0, Math.min(5, score5 ?? 0)) * 20)

/**
 * Lädt und aggregiert alle Datenquellen für den MERIDIAN Executive-Summary-
 * Report (Issue #224). Gibt `null` zurück, wenn noch kein abgeschlossenes
 * Assessment existiert — der Report braucht den Gesamt-Reifegrad als
 * Fundament, alle anderen Blöcke sind einzeln optional (leere Arrays /
 * `null`-Felder, von der Report-Komponente jeweils mit einem Leerzustand
 * abgefangen).
 */
export async function getExecutiveSummaryData(
  userId: string,
  locale: Locale
): Promise<ExecutiveSummaryData | null> {
  const supabase = await createClient()

  const [profileRes, assessmentsRes, portfolioRes, roadmapRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('assessment_sessions')
      .select('archetype, total_score, dim_scores, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(2) as unknown as Promise<{
      data: Array<{ archetype: Archetype; total_score: number; dim_scores: Record<string, number>; created_at: string }> | null
    }>,
    supabase
      .from('uc_portfolios')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null }>,
    supabase
      .from('roadmaps')
      .select('phases')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
      data: { phases: Array<{ actions?: Array<{ label: MaybeLocale }> }> } | null
    }>,
  ])

  const [latest, previous] = assessmentsRes.data ?? []
  if (!latest) return null

  const portfolioId = portfolioRes.data?.id ?? null

  const useCasesRes = portfolioId
    ? await (supabase
        .from('use_cases')
        .select('name, scores, quadrant, governance_result, canvas_id')
        .eq('portfolio_id', portfolioId)
        .order('weighted_score', { ascending: false }) as unknown as Promise<{
        data: Array<{
          name: string
          scores: Record<string, number> | null
          quadrant: QuadrantKey | null
          governance_result: GovernanceVerdict | null
          canvas_id: string | null
        }> | null
      }>)
    : { data: [] }

  const useCases = useCasesRes.data ?? []

  const dimensions: ExecutiveSummaryDimension[] = ASSESSMENT_DIMENSIONS
    .map(dim => ({
      id: dim.id,
      label: DIMENSION_SHORT_LABELS[dim.id]?.[locale] ?? dim.label[locale],
      score100: score100(latest.dim_scores?.[dim.id]),
    }))
    .sort((a, b) => b.score100 - a.score100)

  const topUseCases: ExecutiveSummaryUseCase[] = useCases.slice(0, 3).map(uc => ({
    name: uc.name,
    value100: score100(uc.scores?.value),
    feasibility100: score100(uc.scores?.feasibility),
    quadrant: uc.quadrant,
  }))

  // roadmaps.phases[].actions[].label kann ein roher { de, en }-String sein —
  // handhabungsübliches Archetyp-Template (config/roadmap-data.ts) wird beim
  // Speichern unverändert in die DB übernommen, ohne Locale-Auflösung (siehe
  // RoadmapPageClient.handleSave: `...roadmap[phaseId]` aus ROADMAPS[archetype]).
  // Ohne resolveLocaleField() crasht react-pdf mit React-Fehler #31 ("Objects
  // are not valid as a React child"), sobald ein <Text> ein solches Objekt roh
  // als Kind bekommt — derselbe Bug-Typ, den die alte PDF-Route schon einmal hatte.
  const next90Days = (roadmapRes.data?.phases?.[0]?.actions ?? [])
    .slice(0, 3)
    .map(a => resolveLocaleField(a.label, locale))
    .filter((label): label is string => !!label)

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    overallScore100: score100(latest.total_score),
    archetype: latest.archetype,
    previousScore100: previous ? score100(previous.total_score) : null,
    dimensions,
    topUseCases,
    euAiActStatus: await loadEuAiActStatusV2(
      userId,
      useCases.map(uc => ({ governance_result: uc.governance_result, canvas_id: uc.canvas_id }))
    ),
    next90Days,
  }
}
