import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { ASSESSMENT_DIMENSIONS, ALL_QUESTIONS } from '@/config/assessment-data'
import type { Locale } from '@/i18n/routing'

export interface ReadinessDimension {
  id: string
  label: string
  score100: number
}

export interface ReadinessData {
  companyName: string | null
  assessmentDate: string // ISO, aus assessment_sessions.created_at
  dimensions: ReadinessDimension[] // feste Reihenfolge lt. ASSESSMENT_DIMENSIONS
  weakestDimensionIds: string[] // bis zu 3, aufsteigend nach Score
  questionCount: number
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
 * Lädt die Daten für den MERIDIAN Readiness-Deep-Dive-Report (Musterseite 2,
 * Issue #225). Gibt `null` zurück, wenn kein abgeschlossenes Assessment
 * existiert. Branchenbenchmark + Vorjahresabweichung aus der Musterseite
 * entfallen bewusst — dafür gibt es keine echte Datenquelle (siehe #224,
 * gleiche Entscheidung für die Executive Summary).
 */
export async function getReadinessData(userId: string, locale: Locale): Promise<ReadinessData | null> {
  const supabase = await createClient()

  const [profileRes, assessmentRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('assessment_sessions')
      .select('dim_scores, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
      data: { dim_scores: Record<string, number>; created_at: string } | null
    }>,
  ])

  const assessment = assessmentRes.data
  if (!assessment) return null

  const dimensions: ReadinessDimension[] = ASSESSMENT_DIMENSIONS.map(dim => ({
    id: dim.id,
    label: DIMENSION_SHORT_LABELS[dim.id]?.[locale] ?? dim.label[locale],
    score100: score100(assessment.dim_scores?.[dim.id]),
  }))

  const weakestDimensionIds = [...dimensions]
    .sort((a, b) => a.score100 - b.score100)
    .slice(0, 3)
    .map(d => d.id)

  return {
    companyName: profileRes.data?.company ?? null,
    assessmentDate: assessment.created_at,
    dimensions,
    weakestDimensionIds,
    questionCount: ALL_QUESTIONS.length,
  }
}
