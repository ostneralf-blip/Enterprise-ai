import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { resolveLocaleField } from '@/lib/pdf/normalize-architecture'
import type { Locale } from '@/i18n/routing'

type MaybeLocale = string | { de: string; en: string }
const MAX_ITEMS_PER_HORIZON = 3

export interface RoadmapHorizon {
  eyebrowLabel: string // "HORIZONT 1"
  durationLabel: string
  title: string
  items: Array<{ title: string }>
}

export interface RoadmapStatusData {
  companyName: string | null
  generatedAt: string
  archetype: string | null
  horizons: RoadmapHorizon[] // bis zu 3, nur vorhandene Phasen
  currentScore100: number | null
  previousScore100: number | null
}

const score100 = (score5: number | null | undefined) =>
  Math.round(Math.max(0, Math.min(5, score5 ?? 0)) * 20)

const HORIZON_EYEBROW: Record<string, { de: string; en: string }> = {
  phase1: { de: 'HORIZONT 1', en: 'HORIZON 1' },
  phase2: { de: 'HORIZONT 2', en: 'HORIZON 2' },
  phase3: { de: 'HORIZONT 3', en: 'HORIZON 3' },
}

/**
 * Lädt die Daten für den MERIDIAN Roadmap-Report (Musterseite 5, Issue #225).
 * Gibt `null` zurück, wenn keine gespeicherte Roadmap existiert.
 *
 * roadmaps.phases[].{title,duration,actions[].label} können rohe { de, en }-
 * LocaleString-Objekte sein (Archetyp-Template wird beim Speichern
 * unverändert übernommen, siehe #224-Fix) — resolveLocaleField() konsequent
 * für ALLE dieser Felder, nicht nur actions[].label.
 *
 * "Projektion Reifegrad" + "Review-Kadenz" aus der Musterseite entfallen
 * bewusst: Beides wären erfundene Zukunftswerte (Score-Prognose, feste
 * Review-Termine) ohne echte Datenquelle. Ersetzt durch echte, rückblickende
 * Werte (aktueller vs. vorheriger Assessment-Score), analog zum
 * Vorjahreswert-Muster aus #224.
 */
export async function getRoadmapStatusData(userId: string, locale: Locale): Promise<RoadmapStatusData | null> {
  const supabase = await createClient()

  const [profileRes, roadmapRes, assessmentsRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('roadmaps')
      .select('archetype, phases')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
      data: {
        archetype: string | null
        phases: Array<{
          phase?: string
          title?: MaybeLocale
          duration?: MaybeLocale
          actions?: Array<{ label: MaybeLocale; priority?: string }>
        }>
      } | null
    }>,
    supabase
      .from('assessment_sessions')
      .select('total_score, created_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(2) as unknown as Promise<{ data: Array<{ total_score: number; created_at: string }> | null }>,
  ])

  const roadmap = roadmapRes.data
  if (!roadmap) return null

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 }

  const horizons: RoadmapHorizon[] = roadmap.phases.map((phase, i) => {
    const phaseKey = phase.phase ?? `phase${i + 1}`
    const eyebrow = HORIZON_EYEBROW[phaseKey]?.[locale] ?? phaseKey.toUpperCase()
    const sortedActions = [...(phase.actions ?? [])].sort(
      (a, b) => (priorityRank[a.priority ?? 'low'] ?? 2) - (priorityRank[b.priority ?? 'low'] ?? 2)
    )
    return {
      eyebrowLabel: eyebrow,
      durationLabel: resolveLocaleField(phase.duration, locale) ?? '',
      title: resolveLocaleField(phase.title, locale) ?? '',
      items: sortedActions.slice(0, MAX_ITEMS_PER_HORIZON).map(a => ({
        title: resolveLocaleField(a.label, locale) ?? '',
      })),
    }
  })

  const [latest, previous] = assessmentsRes.data ?? []

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    archetype: roadmap.archetype,
    horizons,
    currentScore100: latest ? score100(latest.total_score) : null,
    previousScore100: previous ? score100(previous.total_score) : null,
  }
}
