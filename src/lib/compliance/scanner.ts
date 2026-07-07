import { createHash } from 'crypto'
import type { ScanSourceResult } from '@/types'

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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return FALLBACK

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Du bist ein Compliance-Analyst. Vergleiche die beiden Texte und antworte NUR als JSON ohne Markdown-Wrapper.

VORHER:
${oldText.slice(0, 3000)}

NACHHER:
${newText.slice(0, 3000)}

Antworte genau so:
{"summary":"<max 3 Sätze auf Deutsch was sich geändert hat>","status_estimate":"<final|entwurf|unklar>"}

final = im EU-Amtsblatt veröffentlicht. entwurf = Vorschlag/Einigung noch nicht verabschiedet. unklar = nicht bestimmbar.`,
        }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return FALLBACK
    const data = await res.json() as { content: Array<{ text: string }> }
    const text = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text) as { summary: string; status_estimate: string }
    if (!parsed.summary) return FALLBACK
    const estimate = ['final', 'entwurf', 'unklar'].includes(parsed.status_estimate)
      ? (parsed.status_estimate as 'final' | 'entwurf' | 'unklar')
      : 'unklar'
    return { summary: parsed.summary, status_estimate: estimate }
  } catch {
    return FALLBACK
  }
}
