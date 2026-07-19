import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { EU_AI_ACT_OBLIGATIONS, EU_AI_ACT_RISK_CLASSES, type CheckStatus } from '@/config/compliance-data'
import { loadEuAiActStatusV2 } from '@/lib/compliance/eu-ai-act-use-case-scoring'
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

export interface ComplianceStatusData {
  companyName: string | null
  generatedAt: string
  riskBands: RiskClassBand[]
  classifiedUseCasesCount: number // Use-Cases mit einer der 3 Risikoklassen — NICHT dasselbe wie die Summe der riskBands.count, siehe gapUseCasesCount
  gapUseCasesCount: number // Use-Cases ohne Canvas-Klassifikation UND ohne governance_result (Bug gefunden 19.07.2026: vorher unsichtbar, Subtitle summierte nur riskBands.count und zeigte "0 Use-Cases" trotz vorhandener, nur unklassifizierter Use-Cases)
  obligations: ObligationStatus[] // Hochrisiko-Pflichten, max. 5, mit echtem Status
  obligationsCompletedCount: number
  obligationsTotalCount: number
}

/**
 * Lädt die Daten für den MERIDIAN Compliance-Report (Musterseite 4, Issue #225).
 * Nutzt dieselbe EU-AI-Act-Status-Berechnung wie die Executive Summary (#224,
 * inzwischen V2 — echte Art.-6-Klassifikation + Kategorie-Zuschläge je Canvas,
 * siehe lib/compliance/eu-ai-act-use-case-scoring.ts, 19.07.2026 mit Daniel
 * abgestimmt) für die Risikoklassen-Zählung. Die Musterseite zeigt vier
 * Dokumentationsstand-Balken mit erfundenen Prozentzahlen (60 %/45 %/80 %/
 * 70 %) — dafür gibt es keine fraktionale Datenquelle (compliance_checks.status
 * ist ein Status-Enum, kein Prozentwert). Ersetzt durch EINEN echten Gesamt-
 * Fortschrittsbalken (erledigte / gesamt Hochrisiko-Pflichten) statt vier
 * erfundener Werte.
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

  const euStatus = await loadEuAiActStatusV2(userId, useCases)

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
  const highRiskObligations = EU_AI_ACT_OBLIGATIONS.high

  const obligations: ObligationStatus[] = highRiskObligations.slice(0, 5).map(ob => ({
    label: ob.label[locale],
    article: ob.article ?? '',
    status: statusByType.get(ob.id) ?? 'pending',
  }))

  const obligationsCompletedCount = highRiskObligations.filter(ob => statusByType.get(ob.id) === 'compliant').length

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    riskBands,
    classifiedUseCasesCount: euStatus?.classifiedCount ?? 0,
    gapUseCasesCount: euStatus?.gapCount ?? 0,
    obligations,
    obligationsCompletedCount,
    obligationsTotalCount: highRiskObligations.length,
  }
}
