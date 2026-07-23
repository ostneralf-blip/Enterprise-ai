import 'server-only'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchText } from './scanner'
import { callLLM } from '@/lib/ai/client'

// Scheduled/manueller Fakten-Abgleich (#250): prüft je Checklistenpunkt einer
// Regularie, ob die hinterlegte Artikel-/Clause-Referenz noch zur Primärquelle
// passt. Ergebnis als Draft in compliance_source_drafts (checklist_item_id gesetzt,
// status bestaetigt/korrektur_vorgeschlagen/unklar). KEIN Auto-Publish — die
// Übernahme läuft über die Admin-Review-UI (#251).

const DeepCheckSchema = z.object({
  // 'unklar' ist bewusst erlaubt: Das Modell darf NICHT aus dem Gedächtnis raten,
  // wenn der Auszug keine Verifikation zulässt (verhindert erfundene Korrekturen).
  verdict: z.enum(['bestaetigt', 'korrektur', 'unklar']),
  suggested_article: z.string().nullable(),
  note: z.string(),
})

/**
 * Schneidet den relevanten Abschnitt um eine Artikel-/Paragraphen-Referenz aus dem
 * (oft sehr langen) Quelltext. Viele Quellen (z. B. eur-lex) liefern das GANZE Gesetz
 * — der gesuchte Artikel liegt tief im Text, nicht in den ersten Zeichen. Nicht
 * auffindbar → null (dann kann nicht verifiziert werden, „unklar" statt Raten).
 */
export function extractArticleWindow(text: string, article: string): string | null {
  const num = article.match(/\d+/)?.[0]
  if (!num) return null
  const patterns = /§/.test(article)
    ? [new RegExp(`§\\s*${num}(?!\\d)`)]
    : [new RegExp(`Artikel\\s*${num}(?!\\d)`), new RegExp(`Article\\s*${num}(?!\\d)`), new RegExp(`Art\\.?\\s*${num}(?!\\d)`)]
  let idx = -1
  for (const p of patterns) { const m = text.search(p); if (m >= 0) { idx = m; break } }
  if (idx < 0) return null
  const start = Math.max(0, idx - 200)
  return text.slice(start, start + 3500)
}

export interface DeepCheckResult {
  slug: string
  checked: number        // Punkte mit article + source_url
  confirmed: number      // Referenz bestätigt
  corrections: number    // Korrektur vorgeschlagen
  unresolved: number     // Quelle nicht abrufbar / LLM ohne Ergebnis
  skipped: number        // ohne article oder source_url
}

interface ItemRow { id: string; item_key: string; article: string | null; source_url: string | null; label: string }

export async function runDeepCheck(regulationSlug: string): Promise<DeepCheckResult> {
  const supabase = await createAdminClient()
  const result: DeepCheckResult = { slug: regulationSlug, checked: 0, confirmed: 0, corrections: 0, unresolved: 0, skipped: 0 }

  const { data: regRows } = await supabase
    .from('compliance_regulations').select('id, locale, short_label').eq('slug', regulationSlug)
  const regDe = (regRows ?? []).find((r: { locale: string }) => r.locale === 'de') as { id: string; short_label: string } | undefined
  if (!regDe) return result
  const regIds = (regRows ?? []).map((r: { id: string }) => r.id)

  // Auf die DE-Zeilen abstellen (article/source_url sind locale-unabhängig).
  const { data: itemsData } = await supabase
    .from('compliance_checklist_items')
    .select('id, item_key, article, source_url, label')
    .in('regulation_id', regIds).eq('locale', 'de').order('display_order')
  const items = (itemsData ?? []) as ItemRow[]
  const itemIds = items.map(i => i.id)

  // Alte offene Deep-Check-Drafts dieser Punkte entfernen (kein Aufstauen).
  if (itemIds.length > 0) {
    await supabase.from('compliance_source_drafts').delete()
      .in('checklist_item_id', itemIds).eq('review_status', 'pending_review')
  }

  const drafts: Record<string, unknown>[] = []
  for (const it of items) {
    if (!it.article || !it.source_url) { result.skipped++; continue }
    result.checked++

    const fullText = await fetchText(it.source_url)
    // Nur den Abschnitt um die Referenz an das LLM geben — nicht die ersten 4000
    // Zeichen eines ggf. kompletten Gesetzestextes (dort steht der Artikel nie).
    const excerpt = fullText ? extractArticleWindow(fullText, it.article!) : null
    let status = 'unklar'
    let suggested: string | null = null
    let summary = 'Primärquelle nicht automatisiert abrufbar — Referenz manuell prüfen.'

    if (fullText && !excerpt) {
      // Quelle abrufbar, aber die Referenz ist darin nicht auffindbar (z. B.
      // Gesamtdokument ohne Anker / 202-Platzhalterseite) → nicht verifizierbar.
      summary = `Referenz "${it.article}" im Quelltext nicht auffindbar — manuell prüfen (Quelle evtl. Gesamtdokument ohne Anker).`
      result.unresolved++
    } else if (excerpt) {
      const prompt = `Du bist Compliance-Analyst. Prüfe ANHAND DES AUSZUGS, ob die Rechtsreferenz "${it.article}" (Regularie "${regDe.short_label}") inhaltlich zum Checklistenpunkt passt.

CHECKLISTENPUNKT: ${it.label}

AUSZUG PRIMÄRQUELLE (${it.source_url}):
${excerpt}

Antworte NUR als JSON ohne Markdown:
{"verdict":"bestaetigt" (Referenz laut Auszug korrekt) | "korrektur" (der Auszug belegt eindeutig eine andere/treffendere Referenz) | "unklar" (der Auszug erlaubt keine Verifikation),"suggested_article":<bei "korrektur" die im Auszug belegte Referenz als String, sonst null>,"note":"<max 2 Sätze auf Deutsch>"}
WICHTIG: Rate NICHT aus dem Gedächtnis. Wenn der Auszug die Frage nicht beantwortet, wähle "unklar".`
      const { data } = await callLLM(prompt, DeepCheckSchema, { model: 'haiku', maxTokens: 300, timeoutMs: 30_000, module: 'compliance' })
      if (data) {
        summary = data.note
        if (data.verdict === 'bestaetigt') { status = 'bestaetigt'; result.confirmed++ }
        else if (data.verdict === 'korrektur') { status = 'korrektur_vorgeschlagen'; suggested = data.suggested_article; result.corrections++ }
        else { status = 'unklar'; result.unresolved++ }
      } else {
        result.unresolved++
      }
    } else {
      result.unresolved++
    }

    drafts.push({
      checklist_item_id: it.id,
      source_url: it.source_url,
      source_label: `${regDe.short_label}: ${it.article}`,
      summary,
      status_estimate: status,
      suggested_value: suggested,
    })
  }

  if (drafts.length > 0) await supabase.from('compliance_source_drafts').insert(drafts)
  return result
}
