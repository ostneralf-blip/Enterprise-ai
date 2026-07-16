import 'server-only'
import { createHash } from 'crypto'
import { z } from 'zod'
import { callLLM } from '@/lib/ai/client'
import type { ScanSourceResult } from '@/types'

const ScanSummarySchema = z.object({
  summary:          z.string(),
  status_estimate:  z.enum(['final', 'entwurf', 'unklar']),
})

export const COMPLIANCE_SOURCES = [
  { url: 'https://www.edpb.europa.eu/news_de', label: 'EDPB Newsroom' },
  { url: 'https://www.datenschutzkonferenz-online.de/pressemitteilungen.html', label: 'DSK Pressemitteilungen' },
  { url: 'https://artificialintelligenceact.eu/implementation-timeline/', label: 'AI Act Timeline' },
  { url: 'https://ai-act-service-desk.ec.europa.eu/s/', label: 'EU AI Act Service Desk' },
  { url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689', label: 'EUR-Lex AI Act Volltext' },
] as const

export type { ScanSourceResult }

export function computeHash(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
}

export async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AI-Navigator-ComplianceMonitor/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return stripHtml(html)
  } catch {
    return null
  }
}

export async function summarizeWithClaude(
  oldText: string,
  newText: string,
): Promise<{ summary: string; status_estimate: 'final' | 'entwurf' | 'unklar' }> {
  const FALLBACK = {
    summary: '(Automatische Zusammenfassung fehlgeschlagen — manuell prüfen)',
    status_estimate: 'unklar' as const,
  }

  const prompt = `Du bist ein Compliance-Analyst. Vergleiche die beiden Texte und antworte NUR als JSON ohne Markdown-Wrapper.

VORHER:
${oldText.slice(0, 3000)}

NACHHER:
${newText.slice(0, 3000)}

Antworte genau so:
{"summary":"<max 3 Sätze auf Deutsch was sich geändert hat>","status_estimate":"<final|entwurf|unklar>"}

final = im EU-Amtsblatt veröffentlicht. entwurf = Vorschlag/Einigung noch nicht verabschiedet. unklar = nicht bestimmbar.`

  const { data } = await callLLM(prompt, ScanSummarySchema, { model: 'haiku', maxTokens: 300, timeoutMs: 30_000, module: 'compliance' })
  return data ?? FALLBACK
}
