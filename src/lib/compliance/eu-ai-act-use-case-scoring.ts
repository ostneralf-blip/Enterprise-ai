import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { analyzeCanvas } from '@/lib/canvas/detection'
import { computeEuAiActStatusV1 } from '@/lib/compliance/eu-ai-act-status-v1'
import type { EuAiActStatusSummary } from '@/lib/compliance/eu-ai-act-status-v1'
import { computeCategoryProgress } from '@/lib/compliance/category-scoring'
import type { CategoryProgress } from '@/lib/compliance/category-scoring'
import type { Canvas } from '@/types'

type GovernanceVerdict = 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'

export interface CanvasForScoring {
  id: string
  title: string
  data: Canvas['data']
  ai_act_assessment: { classification?: { result?: string } } | null
}

export interface UseCaseForScoring {
  governance_result: GovernanceVerdict | null
  canvas: CanvasForScoring | null
}

// Zuschlag pro aktiver Kategorie bei 0 % Fortschritt = 100 × CATEGORY_WEIGHT
// Punkte. Bei drei gleichzeitig komplett unbearbeiteten Kategorien (0,9 =
// 3 × 0,3) übersteigt der Zuschlag allein bereits die HIGH_THRESHOLD (67) —
// mehrere vernachlässigte Compliance-Bereiche können damit einen laut Art. 6
// technisch unkritischen Use-Case dennoch als Hochrisiko einstufen. Mit
// Daniel abgestimmt (19.07.2026): "positiv oder negativ aufs Gesamt-Scoring".
const CATEGORY_WEIGHT = 0.3
const HIGH_THRESHOLD = 67
const LIMITED_THRESHOLD = 34

type RiskBucket = 'high' | 'limited' | 'minimal'

/**
 * Scoring für einen einzelnen Use-Case (Art. 6 EU-AI-Act-Klassifikation als
 * Basis + Zuschlag je aktiver Compliance-Kategorie, siehe Kommentar oben).
 * Gibt `null` zurück, wenn kein Canvas verlinkt ist oder der Canvas noch
 * keine ai_act_assessment hat — dieser Use-Case fällt dann in
 * computeEuAiActStatusV2 auf den V1-Governance-Result-Fallback zurück.
 */
function scoreUseCase(useCase: UseCaseForScoring, categoryProgress: Map<string, CategoryProgress>): RiskBucket | null {
  const canvas = useCase.canvas
  if (!canvas) return null

  const classificationResult = canvas.ai_act_assessment?.classification?.result
  if (!classificationResult) return null

  const base = classificationResult === 'hochrisiko' ? 100 : 0
  const activeCategories = analyzeCanvas(canvas as unknown as Canvas).compliance

  let score = base
  for (const category of activeCategories) {
    const progress = categoryProgress.get(category)
    if (progress && progress.total > 0) {
      score += (100 - progress.pct) * CATEGORY_WEIGHT
    }
  }
  score = Math.min(100, score)

  if (score >= HIGH_THRESHOLD) return 'high'
  if (score >= LIMITED_THRESHOLD) return 'limited'
  return 'minimal'
}

/**
 * EU-AI-Act-Status V2 (19.07.2026, mit Daniel abgestimmt) — ersetzt
 * computeEuAiActStatusV1() als Aufrufziel in den Report-Datenschichten.
 * Liefert dieselbe EuAiActStatusSummary-Form wie V1, damit die Report-
 * Komponenten selbst unverändert bleiben (wie in #224 versprochen).
 *
 * Nutzt für Use-Cases mit verlinktem Canvas + vorhandener ai_act_assessment
 * die echte Art.-6-Klassifikation plus Kategorie-Zuschläge. Für alle
 * anderen Use-Cases (kein Canvas verlinkt oder noch keine KI-Einordnung im
 * Canvas durchgeführt) greift automatisch der V1-Fallback über
 * governance_result — kein Fehlerzustand, einfach eine gröbere Einstufung
 * für diesen einzelnen Use-Case.
 */
export function computeEuAiActStatusV2(
  useCases: UseCaseForScoring[],
  categoryProgress: Map<string, CategoryProgress>
): EuAiActStatusSummary | null {
  if (useCases.length === 0) return null

  let highCount = 0
  let limitedCount = 0
  let minimalCount = 0
  const fallbackUseCases: Array<{ governance_result: GovernanceVerdict | null }> = []

  for (const useCase of useCases) {
    const bucket = scoreUseCase(useCase, categoryProgress)
    if (bucket === 'high') highCount++
    else if (bucket === 'limited') limitedCount++
    else if (bucket === 'minimal') minimalCount++
    else fallbackUseCases.push({ governance_result: useCase.governance_result })
  }

  let gapCount = 0
  if (fallbackUseCases.length > 0) {
    const fallbackSummary = computeEuAiActStatusV1(fallbackUseCases)
    if (fallbackSummary) {
      highCount += fallbackSummary.highCount
      limitedCount += fallbackSummary.limitedCount
      minimalCount += fallbackSummary.minimalCount
      gapCount += fallbackSummary.gapCount
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

/**
 * Orchestriert V2 komplett (Canvas-Laden + Kategorie-Fortschritt + Scoring) —
 * gemeinsam von der Executive-Summary- und der Compliance-Report-Datenschicht
 * genutzt (#224/#225), damit die Canvas-Join-Logik nicht doppelt gepflegt wird.
 */
export async function loadEuAiActStatusV2(
  userId: string,
  useCases: Array<{ canvas_id: string | null; governance_result: GovernanceVerdict | null }>
): Promise<EuAiActStatusSummary | null> {
  if (useCases.length === 0) return null

  const supabase = await createClient()
  const canvasIds = [...new Set(useCases.map(uc => uc.canvas_id).filter((id): id is string => !!id))]

  const [canvasesRes, categoryProgress] = await Promise.all([
    canvasIds.length > 0
      ? (supabase
          .from('canvases')
          .select('id, title, data, ai_act_assessment')
          .in('id', canvasIds) as unknown as Promise<{ data: CanvasForScoring[] | null }>)
      : Promise.resolve({ data: [] as CanvasForScoring[] }),
    computeCategoryProgress(userId),
  ])

  const canvasById = new Map((canvasesRes.data ?? []).map(c => [c.id, c]))

  const scoringInput: UseCaseForScoring[] = useCases.map(uc => ({
    governance_result: uc.governance_result,
    canvas: uc.canvas_id ? (canvasById.get(uc.canvas_id) ?? null) : null,
  }))

  return computeEuAiActStatusV2(scoringInput, categoryProgress)
}
