import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { ChecklistItem, AdditionalRegulation, EuAiActRiskClass } from '@/config/compliance-data'

// DB-Zugriffsschicht für Compliance-Inhalte (#246). Liest compliance_regulations +
// compliance_checklist_items (nur is_published, RLS-respektierend) und REKONSTRUIERT
// exakt die bisherigen Shapes aus compliance-data.ts (DSGVO_CHECKLIST,
// EU_AI_ACT_OBLIGATIONS, ADDITIONAL_REGULATIONS) inkl. {de,en}-LocaleStrings aus den
// beiden Locale-Zeilen. So bleiben die Konsumenten (UI, PDF, Scoring) unverändert.

interface RegRow {
  id: string; slug: string; locale: string; category: string
  short_label: string; label: string; description: string | null; applicability: string | null
  display_order: number
}
interface ItemRow {
  regulation_id: string; item_key: string; locale: string; risk_class: string | null
  article: string | null; source_url: string | null; last_verified: string | null
  label: string; description: string | null; relevance: string | null; category: string | null
  display_order: number
}

export interface ComplianceContent {
  dsgvo: ChecklistItem[]
  euAiActObligations: Record<EuAiActRiskClass, ChecklistItem[]>
  additional: AdditionalRegulation[]
  /** Jüngstes last_verified über alle Punkte (für „Rechtsstand zuletzt geprüft", #247). */
  latestVerified: string | null
}

const RISK_CLASSES: EuAiActRiskClass[] = ['prohibited', 'high', 'limited', 'minimal']

function ls(de: string | null, en: string | null) {
  if (de == null && en == null) return undefined
  return { de: de ?? '', en: en ?? '' }
}

/** Fügt die DE/EN-Zeile eines Checklistenpunkts zu einem ChecklistItem zusammen. */
function mergeItem(de: ItemRow, en: ItemRow | undefined): ChecklistItem {
  const item: ChecklistItem = {
    id: de.item_key,
    label: { de: de.label, en: en?.label ?? de.label },
  }
  if (de.article) item.article = de.article
  if (de.category) item.category = de.category
  if (de.source_url) item.sourceUrl = de.source_url
  if (de.last_verified) item.lastVerified = de.last_verified
  const desc = ls(de.description, en?.description ?? null); if (desc) item.description = desc
  const rel = ls(de.relevance, en?.relevance ?? null); if (rel) item.relevance = rel
  return item
}

// Per-Request memoisiert (React cache): mehrere Konsumenten im selben Request
// (Seite, Scoring, PDF) teilen sich EINE Abfrage statt sie zu wiederholen.
export const getComplianceContent = cache(async (): Promise<ComplianceContent> => {
  const supabase = await createClient()
  const [{ data: regsData }, { data: itemsData }] = await Promise.all([
    supabase.from('compliance_regulations').select('id, slug, locale, category, short_label, label, description, applicability, display_order').eq('is_published', true),
    supabase.from('compliance_checklist_items').select('regulation_id, item_key, locale, risk_class, article, source_url, last_verified, label, description, relevance, category, display_order').eq('is_published', true).order('display_order', { ascending: true }),
  ])
  const regs = (regsData ?? []) as RegRow[]
  const items = (itemsData ?? []) as ItemRow[]

  const regIdToSlug = new Map<string, string>()
  for (const r of regs) regIdToSlug.set(r.id, r.slug)

  // Items je (slug, item_key) → { de, en }-Zeilenpaar, geordnet nach display_order.
  type Pair = { de?: ItemRow; en?: ItemRow; order: number; risk: string | null }
  const bySlug = new Map<string, Map<string, Pair>>()
  for (const row of items) {
    const slug = regIdToSlug.get(row.regulation_id)
    if (!slug) continue
    let m = bySlug.get(slug); if (!m) { m = new Map(); bySlug.set(slug, m) }
    let p = m.get(row.item_key); if (!p) { p = { order: row.display_order, risk: row.risk_class }; m.set(row.item_key, p) }
    if (row.locale === 'en') p.en = row; else p.de = row
  }

  function itemsForSlug(slug: string): { item: ChecklistItem; risk: string | null }[] {
    const m = bySlug.get(slug); if (!m) return []
    return [...m.values()]
      .filter(p => p.de) // DE-Zeile ist die Basis
      .sort((a, b) => a.order - b.order)
      .map(p => ({ item: mergeItem(p.de!, p.en), risk: p.risk }))
  }

  // DSGVO
  const dsgvo = itemsForSlug('dsgvo').map(x => x.item)

  // EU AI Act — nach Risikoklasse gruppieren
  const euAiActObligations = { prohibited: [], high: [], limited: [], minimal: [] } as Record<EuAiActRiskClass, ChecklistItem[]>
  for (const { item, risk } of itemsForSlug('eu_ai_act')) {
    if (risk && RISK_CLASSES.includes(risk as EuAiActRiskClass)) euAiActObligations[risk as EuAiActRiskClass].push(item)
  }

  // Additional Regulations — reg-Metadaten aus DE/EN-Zeilenpaar rekonstruieren
  const ADDITIONAL_SLUGS = ['iso_42001', 'nis2', 'iso_27001', 'bait', 'lksg']
  const regBySlug = new Map<string, { de?: RegRow; en?: RegRow }>()
  for (const r of regs) {
    let e = regBySlug.get(r.slug); if (!e) { e = {}; regBySlug.set(r.slug, e) }
    if (r.locale === 'en') e.en = r; else e.de = r
  }
  const additional: AdditionalRegulation[] = []
  // Reihenfolge über display_order der DE-Regulierungszeile
  const additionalOrdered = ADDITIONAL_SLUGS
    .map(slug => ({ slug, de: regBySlug.get(slug)?.de, en: regBySlug.get(slug)?.en }))
    .filter((x): x is { slug: string; de: RegRow; en: RegRow | undefined } => Boolean(x.de))
    .sort((a, b) => a.de.display_order - b.de.display_order)
  for (const { slug, de, en } of additionalOrdered) {
    additional.push({
      id: slug,
      shortLabel: { de: de.short_label, en: en?.short_label ?? de.short_label },
      label: { de: de.label, en: en?.label ?? de.label },
      description: ls(de.description, en?.description ?? null) ?? { de: '', en: '' },
      applicability: ls(de.applicability, en?.applicability ?? null) ?? { de: '', en: '' },
      items: itemsForSlug(slug).map(x => x.item),
    })
  }

  // Jüngstes last_verified über alle Punkte
  let latestVerified: string | null = null
  for (const row of items) {
    if (row.last_verified && (!latestVerified || row.last_verified > latestVerified)) latestVerified = row.last_verified
  }

  return { dsgvo, euAiActObligations, additional, latestVerified }
})

/**
 * Baut die id → „Artikel: Label"-Map für den Legacy-PDF-Export (#246). Ersetzt
 * die früher in templates.tsx aus der statischen Config aufgebaute labelMap
 * (EU AI Act alle Risikoklassen + DSGVO).
 */
export async function buildComplianceLabelMap(locale: 'de' | 'en'): Promise<Map<string, string>> {
  const content = await getComplianceContent()
  const map = new Map<string, string>()
  const add = (items: { id: string; article?: string; label: { de: string; en: string } }[]) => {
    for (const i of items) map.set(i.id, `${i.article}: ${i.label[locale]}`)
  }
  for (const items of Object.values(content.euAiActObligations)) add(items)
  add(content.dsgvo)
  return map
}

/** Nur die Slugs aller (published) Regularien — für Zod-Validierung in der API. */
export async function getRegulationSlugs(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('compliance_regulations').select('slug').eq('locale', 'de').eq('is_published', true)
  return [...new Set((data ?? []).map((r: { slug: string }) => r.slug))]
}

export interface ComplianceTrigger {
  slug: string
  label: { de: string; en: string }
  keywords: string[]
}

/**
 * Trigger-Keywords je (published) Regularie für die DB-getriebene Compliance-
 * Erkennung in Canvas + Architektur. Kombiniert die Keywords beider Locale-Zeilen,
 * kleingeschrieben. label = short_label je Locale (Anzeige „<label> relevant").
 * Regularien ohne Keywords entfallen (keine Fehl-Erkennung ohne konfigurierte Trigger).
 */
export const getComplianceTriggers = cache(async (): Promise<ComplianceTrigger[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('compliance_regulations')
    .select('slug, locale, short_label, trigger_keywords, display_order')
    .eq('is_published', true)
    .order('display_order')
  const rows = (data ?? []) as { slug: string; locale: string; short_label: string; trigger_keywords: string[] | null; display_order: number }[]
  const bySlug = new Map<string, ComplianceTrigger & { order: number }>()
  for (const r of rows) {
    let t = bySlug.get(r.slug)
    if (!t) { t = { slug: r.slug, label: { de: r.short_label, en: r.short_label }, keywords: [], order: r.display_order }; bySlug.set(r.slug, t) }
    if (r.locale === 'de') t.label.de = r.short_label
    if (r.locale === 'en') t.label.en = r.short_label
    for (const k of r.trigger_keywords ?? []) { const kl = k.toLowerCase().trim(); if (kl && !t.keywords.includes(kl)) t.keywords.push(kl) }
  }
  return [...bySlug.values()]
    .filter(t => t.keywords.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...t }) => t)
})
