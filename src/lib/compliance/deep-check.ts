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
  matches: z.boolean(),
  suggested_article: z.string().nullable(),
  note: z.string(),
})

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

    const text = await fetchText(it.source_url)
    let status = 'unklar'
    let suggested: string | null = null
    let summary = 'Primärquelle nicht automatisiert abrufbar — Referenz manuell prüfen.'

    if (text) {
      const prompt = `Du bist Compliance-Analyst. Prüfe, ob die Rechtsreferenz "${it.article}" (Regularie "${regDe.short_label}") inhaltlich zum folgenden Checklistenpunkt passt.

CHECKLISTENPUNKT: ${it.label}

AUSZUG PRIMÄRQUELLE (${it.source_url}):
${text.slice(0, 4000)}

Antworte NUR als JSON ohne Markdown:
{"matches":<true wenn die Referenz korrekt ist, sonst false>,"suggested_article":<bei false die korrekte Referenz als String, sonst null>,"note":"<max 2 Sätze auf Deutsch, Begründung>"}`
      const { data } = await callLLM(prompt, DeepCheckSchema, { model: 'haiku', maxTokens: 300, timeoutMs: 30_000, module: 'compliance' })
      if (data) {
        status = data.matches ? 'bestaetigt' : 'korrektur_vorgeschlagen'
        suggested = data.matches ? null : data.suggested_article
        summary = data.note
        if (data.matches) result.confirmed++
        else result.corrections++
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
