import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { DSGVO_CHECKLIST, EU_AI_ACT_OBLIGATIONS, ADDITIONAL_REGULATIONS } from '@/config/compliance-data'
import type { LocaleString } from '@/lib/utils/locale-data'

export interface RegulationProgress {
  id: string
  label: LocaleString
  completed: number
  total: number
  pct: number // 0-100
}

// Checklisten-Definition je Regulation-ID (Stand 19.07.2026, mit Daniel
// abgestimmt: das Compliance-Scoring bezieht sich auf die GLOBAL aktivierten
// Regularien — DSGVO + EU AI Act sind Kern und immer aktiv, die "Weiteren
// Regularien" (nis2, iso_27001, iso_42001, bait, lksg) werden vom Nutzer auf
// der Compliance-Seite per Toggle aktiviert und in compliance_checks als
// regulation='system', check_type='active_regulations' (JSON-Liste) hinterlegt).
const CORE_CHECKLISTS: Array<{ id: string; label: LocaleString; itemIds: string[] }> = [
  { id: 'dsgvo',    label: { de: 'DSGVO', en: 'GDPR' },            itemIds: DSGVO_CHECKLIST.map(i => i.id) },
  { id: 'eu_ai_act', label: { de: 'EU AI Act', en: 'EU AI Act' }, itemIds: EU_AI_ACT_OBLIGATIONS.high.map(i => i.id) },
]

function additionalChecklist(id: string): { id: string; label: LocaleString; itemIds: string[] } | null {
  const reg = ADDITIONAL_REGULATIONS.find(r => r.id === id)
  if (!reg || reg.items.length === 0) return null
  return { id: reg.id, label: reg.shortLabel, itemIds: reg.items.map(i => i.id) }
}

/**
 * Lädt den kontoweiten Fortschritt je AKTIVIERTER Regularie. Kern (DSGVO,
 * EU AI Act) ist immer dabei, zusätzliche Regularien nur, wenn der Nutzer sie
 * auf der Compliance-Seite aktiviert hat. compliance_checks ist kontoweit, nicht
 * pro Use-Case — der Fortschritt gilt daher unternehmensweit (eine Maßnahme wie
 * ein Verarbeitungsverzeichnis ist eine Unternehmens-, keine Use-Case-Maßnahme).
 */
export async function computeRegulationProgress(userId: string): Promise<RegulationProgress[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('compliance_checks')
    .select('regulation, check_type, status, notes')
    .eq('user_id', userId) as unknown as {
    data: Array<{ regulation: string; check_type: string; status: string; notes: string | null }> | null
  }
  const checks = data ?? []

  // Aktivierte Zusatz-Regularien aus der Meta-Zeile (regulation='system',
  // check_type='active_regulations', notes = JSON-Array der aktivierten IDs).
  const activeRow = checks.find(c => c.regulation === 'system' && c.check_type === 'active_regulations')
  let activeAdditionalIds: string[] = []
  if (activeRow?.notes) {
    try { activeAdditionalIds = JSON.parse(activeRow.notes) as string[] } catch { activeAdditionalIds = [] }
  }

  const checklists = [
    ...CORE_CHECKLISTS,
    ...activeAdditionalIds.map(additionalChecklist).filter((c): c is NonNullable<typeof c> => c !== null),
  ]

  return checklists.map(({ id, label, itemIds }) => {
    const completed = checks.filter(
      c => c.regulation === id && itemIds.includes(c.check_type) && c.status === 'compliant'
    ).length
    return { id, label, completed, total: itemIds.length, pct: itemIds.length > 0 ? Math.round((completed / itemIds.length) * 100) : 0 }
  })
}

// Zuschlag aus dem Fortschritt aller aktivierten Regularien — jede Regularie
// mit gleichem Gewicht (Daniel: "mit den gleichen Scoring Werten
// berücksichtigt"). Je unvollständiger eine aktivierte Regularie, desto höher
// der Zuschlag. Wird global (identisch) auf jeden bewerteten Use-Case
// angewendet; nach oben durch die Score-Deckelung auf 100 begrenzt.
export const REGULATION_SURCHARGE_WEIGHT = 0.3

export function surchargeFromProgress(progress: RegulationProgress[]): number {
  return progress.reduce((sum, p) => sum + (100 - p.pct) * REGULATION_SURCHARGE_WEIGHT, 0)
}
