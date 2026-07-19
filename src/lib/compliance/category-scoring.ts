import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { DSGVO_CHECKLIST, EU_AI_ACT_OBLIGATIONS, ADDITIONAL_REGULATIONS } from '@/config/compliance-data'

export interface CategoryProgress {
  completed: number
  total: number
  pct: number // 0-100
}

/**
 * Kanonische Compliance-Kategorie (Anzeigetext von analyzeCanvas().compliance,
 * siehe lib/canvas/detection.ts) → zugehörige regulation + Checklisten-Item-IDs
 * in compliance_checks. Zwei der 7 Kategorien (Gesundheitsdaten/MDR,
 * EU-Hosting/Datensouveränität) haben KEINE eigene Checkliste im System —
 * bewusst nicht in dieser Map, damit computeEuAiActStatusV2 sie ohne echte
 * Datenquelle überspringt statt einen Zuschlag zu erfinden.
 */
const CATEGORY_CHECKLISTS: Record<string, { regulation: string; itemIds: string[] }> = {
  'DSGVO relevant': {
    regulation: 'dsgvo',
    itemIds: DSGVO_CHECKLIST.map(i => i.id),
  },
  'EU AI Act relevant': {
    regulation: 'eu_ai_act',
    itemIds: EU_AI_ACT_OBLIGATIONS.high.map(i => i.id),
  },
  'ISO 27001 / IT-Sicherheit relevant': {
    regulation: 'iso_27001',
    itemIds: ADDITIONAL_REGULATIONS.find(r => r.id === 'iso_27001')?.items.map(i => i.id) ?? [],
  },
  'NIS2 / KRITIS relevant': {
    regulation: 'nis2',
    itemIds: ADDITIONAL_REGULATIONS.find(r => r.id === 'nis2')?.items.map(i => i.id) ?? [],
  },
  // BAIT (Bankaufsichtliche IT-Anforderungen) ist die einzige im System
  // hinterlegte Finanzregulierungs-Checkliste — nächstliegende Zuordnung für
  // die Kategorie "Finanzregulierung relevant".
  'Finanzregulierung relevant': {
    regulation: 'bait',
    itemIds: ADDITIONAL_REGULATIONS.find(r => r.id === 'bait')?.items.map(i => i.id) ?? [],
  },
}

/**
 * Lädt den kontoweiten Fortschritt je Compliance-Kategorie (Issue: EU-AI-Act-
 * Use-Case-Scoring, 19.07.2026 mit Daniel abgestimmt). compliance_checks ist
 * kontoweit, nicht pro Use-Case — der Fortschritt einer Kategorie wird daher
 * auf JEDEN Use-Case angewendet, dessen Canvas diese Kategorie als relevant
 * erkennt (siehe computeEuAiActStatusV2). Das ist inhaltlich vertretbar:
 * ob z. B. ein Verarbeitungsverzeichnis existiert, ist eine
 * Unternehmensmaßnahme, keine Use-Case-Maßnahme.
 */
export async function computeCategoryProgress(userId: string): Promise<Map<string, CategoryProgress>> {
  const supabase = await createClient()
  const regulations = Object.values(CATEGORY_CHECKLISTS).map(c => c.regulation)

  const { data } = await supabase
    .from('compliance_checks')
    .select('regulation, check_type, status')
    .eq('user_id', userId)
    .in('regulation', regulations) as unknown as {
    data: Array<{ regulation: string; check_type: string; status: string }> | null
  }
  const checks = data ?? []

  const result = new Map<string, CategoryProgress>()
  for (const [category, { regulation, itemIds }] of Object.entries(CATEGORY_CHECKLISTS)) {
    if (itemIds.length === 0) continue
    const completed = checks.filter(
      c => c.regulation === regulation && itemIds.includes(c.check_type) && c.status === 'compliant'
    ).length
    result.set(category, { completed, total: itemIds.length, pct: Math.round((completed / itemIds.length) * 100) })
  }
  return result
}
