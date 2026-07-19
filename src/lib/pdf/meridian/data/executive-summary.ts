import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { ASSESSMENT_DIMENSIONS } from '@/config/assessment-data'
import type { Locale } from '@/i18n/routing'

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

// EU-AI-Act-Status — V1-Datenschicht (Issue #224). Nutzt den Governance-Check
// als Proxy für die Risikoeinstufung eines Use Cases: jedes Ergebnis eines
// Governance-Checks (use_cases.governance_result, siehe Issue #65) wird 1:1
// auf eine der drei anzeigbaren EU-AI-Act-Risikoklassen abgebildet.
//
// Das ist bewusst eine Vereinfachung: Der Governance-Check bewertet aktuell
// EINEN Use Case pauschal, nicht die tatsächliche EU-AI-Act-Einstufung nach
// Anhang III. Eine vollständigere Lösung (von Daniel am 19.07.2026 skizziert,
// siehe CLAUDE.md → "Use-Case-Compliance-Scoring") würde stattdessen ein
// eigenes Scoring pro Use Case aus dessen Klassifizierungsmerkmalen (z. B.
// DSGVO-Relevanz, Mitarbeiterdaten-Bezug) ableiten und mehrere Use Cases zu
// einem Gesamt-Scoring aggregieren.
//
// Damit dieser Umbau später NICHT die PDF-Komponente anfassen muss, ist die
// Zuordnung hier absichtlich in einer einzelnen, isolierten Funktion
// gekapselt, die nur die generische Zielform `EuAiActStatusSummary` zurückgibt.
// Eine künftige `computeEuAiActStatusV2()` müsste nur diese Funktion ersetzen.
export interface EuAiActStatusSummary {
  highCount: number
  limitedCount: number
  minimalCount: number
  classifiedCount: number
  gapCount: number
}

export function computeEuAiActStatusV1(
  useCases: Array<{ governance_result: GovernanceVerdict | null }>
): EuAiActStatusSummary | null {
  if (useCases.length === 0) return null

  let highCount = 0
  let limitedCount = 0
  let minimalCount = 0
  let gapCount = 0

  for (const uc of useCases) {
    switch (uc.governance_result) {
      case 'stop_dsgvo':
      case 'stop_risk':
        highCount++
        break
      case 'improve':
        limitedCount++
        break
      case 'approve':
        minimalCount++
        break
      default:
        gapCount++
    }
  }

  return {
    highCount,
    limitedCount,
    minimalCount,
    classifiedCount: useCases.length - gapCount,
    gapCount,
  }
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
      data: { phases: Array<{ actions?: Array<{ label: string }> }> } | null
    }>,
  ])

  const [latest, previous] = assessmentsRes.data ?? []
  if (!latest) return null

  const portfolioId = portfolioRes.data?.id ?? null

  const useCasesRes = portfolioId
    ? await (supabase
        .from('use_cases')
        .select('name, scores, quadrant, governance_result')
        .eq('portfolio_id', portfolioId)
        .order('weighted_score', { ascending: false }) as unknown as Promise<{
        data: Array<{
          name: string
          scores: Record<string, number> | null
          quadrant: QuadrantKey | null
          governance_result: GovernanceVerdict | null
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

  const next90Days = (roadmapRes.data?.phases?.[0]?.actions ?? [])
    .slice(0, 3)
    .map(a => a.label)

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    overallScore100: score100(latest.total_score),
    archetype: latest.archetype,
    previousScore100: previous ? score100(previous.total_score) : null,
    dimensions,
    topUseCases,
    euAiActStatus: computeEuAiActStatusV1(
      useCases.map(uc => ({ governance_result: uc.governance_result }))
    ),
    next90Days,
  }
}
