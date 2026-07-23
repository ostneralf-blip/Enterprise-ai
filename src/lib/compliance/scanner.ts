import 'server-only'
import { createHash } from 'crypto'
import { z } from 'zod'
import { callLLM } from '@/lib/ai/client'
import type { ScanSourceResult } from '@/types'

const ScanSummarySchema = z.object({
  summary:          z.string(),
  status_estimate:  z.enum(['final', 'entwurf', 'unklar']),
})

// Änderungs-Monitoring-Quellen (#248): Zwei Quellen wurden entfernt, weil sie sich
// nicht per einfachem fetch() synchronisieren lassen und still dauerhaft fehlschlugen:
//  - „EU AI Act Service Desk" (ai-act-service-desk.ec.europa.eu/s/): Salesforce-
//    Experience-Cloud-SPA, clientseitig gerendert → fetch bekommt nur eine leere Hülle.
//  - „EUR-Lex AI Act Volltext" (CELEX:32024R1689): aggressiver Bot-/WAF-Schutz lässt
//    automatisierte Anfragen hängen (10s-Timeout → still null).
// Als scrapebarer Stellvertreter für Volltextänderungen dient artificialintelligenceact.eu
// (inoffiziell, aber verlässlich abrufbar — Kontrollabruf lieferte sauberes HTML).
export const COMPLIANCE_SOURCES = [
  { url: 'https://www.edpb.europa.eu/news_de', label: 'EDPB Newsroom' },
  { url: 'https://www.datenschutzkonferenz-online.de/pressemitteilungen.html', label: 'DSK Pressemitteilungen' },
  { url: 'https://artificialintelligenceact.eu/implementation-timeline/', label: 'AI Act Timeline' },
  { url: 'https://artificialintelligenceact.eu/the-act/', label: 'EU AI Act Volltext (inoffiziell, artificialintelligenceact.eu)' },
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
      // Realistischer Browser-UA (#248): manche öffentlichen Quellen weisen
      // erkennbar automatisierte Clients ab. Bleibt best-effort — WAFs, die
      // die Verbindung hängen lassen, fängt weiterhin der 10s-Timeout ab.
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de,en;q=0.9',
      },
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
