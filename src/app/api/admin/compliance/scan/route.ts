import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const COMPLIANCE_SOURCES = [
  { url: 'https://www.edpb.europa.eu/news_de', label: 'EDPB Newsroom' },
  { url: 'https://www.datenschutzkonferenz-online.de/pressemitteilungen.html', label: 'DSK Pressemitteilungen' },
  { url: 'https://artificialintelligenceact.eu/implementation-timeline/', label: 'AI Act Timeline' },
  { url: 'https://ai-act-service-desk.ec.europa.eu/s/', label: 'EU AI Act Service Desk' },
  { url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689', label: 'EUR-Lex AI Act Volltext' },
]

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
}

async function fetchText(url: string): Promise<string | null> {
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

async function summarizeWithClaude(oldText: string, newText: string): Promise<{ summary: string; status_estimate: 'final' | 'entwurf' | 'unklar' }> {
  const FALLBACK = { summary: '(Automatische Zusammenfassung fehlgeschlagen — manuell prüfen)', status_estimate: 'unklar' as const }

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

export async function POST() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  let changed = 0
  let draftsCreated = 0

  for (const source of COMPLIANCE_SOURCES) {
    const newText = await fetchText(source.url)
    if (!newText) continue

    const newHash = createHash('sha256').update(newText).digest('hex')

    const { data: lastSnapshot, error: lastSnapshotError } = await supabase
      .from('source_snapshots')
      .select('content_hash, id')
      .eq('url', source.url)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastSnapshotError) {
      console.error('Failed to fetch last snapshot:', lastSnapshotError.message)
      continue
    }

    const { error: snapshotInsertError } = await supabase.from('source_snapshots').insert({
      url: source.url,
      label: source.label,
      content_hash: newHash,
    })
    if (snapshotInsertError) {
      console.error('Snapshot insert failed:', snapshotInsertError.message)
      continue
    }

    if (!lastSnapshot || lastSnapshot.content_hash === newHash) continue

    changed++

    const { summary, status_estimate } = await summarizeWithClaude(
      `(Vorheriger Inhalt nicht mehr verfügbar — Hash: ${lastSnapshot.content_hash ?? 'unbekannt'})`,
      newText,
    )

    const { error: draftError } = await supabase.from('compliance_source_drafts').insert({
      source_url: source.url,
      source_label: source.label,
      summary,
      status_estimate,
    })
    if (draftError) {
      console.error(`Draft insert failed for ${source.label}:`, draftError.message)
    } else {
      draftsCreated++
    }
  }

  return NextResponse.json({
    scanned: COMPLIANCE_SOURCES.length,
    changed,
    drafts_created: draftsCreated,
  })
}
