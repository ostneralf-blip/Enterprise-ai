import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { EU_AI_ACT_RISK_CLASSES, type CheckStatus } from '@/config/compliance-data'
import { getComplianceContent } from '@/lib/compliance/db'
import { scoreUseCasesWithProgress } from '@/lib/compliance/eu-ai-act-use-case-scoring'
import { computeRegulationProgress, surchargeFromProgress } from '@/lib/compliance/category-scoring'
import type { Locale } from '@/i18n/routing'

export interface RiskClassBand {
  id: 'prohibited' | 'high' | 'limited' | 'minimal'
  count: number
  title: string
  articleRef: string
  summary: string
}

export interface ObligationStatus {
  label: string
  article: string
  status: CheckStatus
}

export interface RegulationDocStatus {
  label: string
  completed: number
  total: number
  pct: number
}

export interface ComplianceStatusData {
  companyName: string | null
  generatedAt: string
  riskBands: RiskClassBand[]
  classifiedUseCasesCount: number // Use-Cases mit einer der 3 Risikoklassen — NICHT dasselbe wie die Summe der riskBands.count, siehe gapUseCasesCount
  gapUseCasesCount: number // Use-Cases ohne Canvas UND ohne governance_result (Bug gefunden 19.07.2026: vorher unsichtbar, Subtitle summierte nur riskBands.count und zeigte "0 Use-Cases" trotz vorhandener, nur unklassifizierter Use-Cases)
  obligations: ObligationStatus[] // Hochrisiko-Pflichten, max. 5, mit echtem Status
  documentationStatus: RegulationDocStatus[] // Fortschritt je AKTIVIERTER Regularie (DSGVO/EU AI Act + Toggles), 19.07.2026 mit Daniel abgestimmt
}

/**
 * Lädt die Daten für den MERIDIAN Compliance-Report (Musterseite 4, Issue #225).
 * Nutzt dieselbe EU-AI-Act-Status-Berechnung wie die Executive Summary (#224,
 * inzwischen V2 — Art.-6-Klassifikation + globaler Zuschlag aus dem Fortschritt
 * der aktivierten Regularien, siehe lib/compliance/eu-ai-act-use-case-scoring.ts,
 * 19.07.2026 mit Daniel abgestimmt) für die Risikoklassen-Zählung.
 *
 * Der Dokumentationsstand-Block der Musterseite zeigte vier erfundene
 * Einzelprozentwerte (60 %/45 %/80 %/70 %) — jetzt ersetzt durch echte
 * Fortschrittsbalken, EINER pro AKTIVIERTER Regularie (DSGVO + EU AI Act immer,
 * NIS2/ISO/... nur wenn vom Nutzer aktiviert), aus dem kontoweiten
 * Checklisten-Fortschritt (erledigte / gesamt Pflichten).
 */
export async function getComplianceStatusData(userId: string, locale: Locale): Promise<ComplianceStatusData | null> {
  const supabase = await createClient()

  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('uc_portfolios')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null }>,
  ])

  const portfolioId = portfolioRes.data?.id ?? null

  const [useCasesRes, checksRes] = await Promise.all([
    portfolioId
      ? (supabase
          .from('use_cases')
          .select('governance_result, canvas_id')
          .eq('portfolio_id', portfolioId) as unknown as Promise<{
          data: Array<{ governance_result: 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve' | null; canvas_id: string | null }> | null
        }>)
      : Promise.resolve({ data: [] }),
    supabase
      .from('compliance_checks')
      .select('check_type, status')
      .eq('user_id', userId)
      .eq('regulation', 'eu_ai_act') as unknown as Promise<{
      data: Array<{ check_type: string; status: CheckStatus }> | null
    }>,
  ])

  const useCases = useCasesRes.data ?? []
  const checks = checksRes.data ?? []
  if (useCases.length === 0 && checks.length === 0) return null

  // Regulierungs-Fortschritt einmal laden — für den globalen Scoring-Zuschlag
  // UND den Dokumentationsstand-Block (je aktivierter Regularie ein Balken).
  const regulationProgress = await computeRegulationProgress(userId)
  const euStatus = await scoreUseCasesWithProgress(userId, useCases, surchargeFromProgress(regulationProgress))

  const riskBands: RiskClassBand[] = (['prohibited', 'high', 'limited', 'minimal'] as const).map(id => {
    const def = EU_AI_ACT_RISK_CLASSES.find(c => c.id === id)
    const count = id === 'prohibited' ? 0
      : id === 'high' ? (euStatus?.highCount ?? 0)
      : id === 'limited' ? (euStatus?.limitedCount ?? 0)
      : (euStatus?.minimalCount ?? 0)
    return {
      id,
      count,
      title: def?.title[locale] ?? id,
      articleRef: def?.articleRef ?? '',
      summary: def?.summary[locale] ?? '',
    }
  })

  const statusByType = new Map(checks.map(c => [c.check_type, c.status]))
  const highRiskObligations = (await getComplianceContent()).euAiActObligations.high

  const obligations: ObligationStatus[] = highRiskObligations.slice(0, 5).map(ob => ({
    label: ob.label[locale],
    article: ob.article ?? '',
    status: statusByType.get(ob.id) ?? 'pending',
  }))

  const documentationStatus: RegulationDocStatus[] = regulationProgress.map(p => ({
    label: p.label[locale],
    completed: p.completed,
    total: p.total,
    pct: p.pct,
  }))

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    riskBands,
    classifiedUseCasesCount: euStatus?.classifiedCount ?? 0,
    gapUseCasesCount: euStatus?.gapCount ?? 0,
    obligations,
    documentationStatus,
  }
}
