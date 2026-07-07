import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { COMPLIANCE_SOURCES, computeHash, fetchText, summarizeWithClaude } from '@/lib/compliance/scanner'
import type { ScanSourceResult } from '@/types'

export async function POST() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  let changed = 0
  let draftsCreated = 0
  const sources: ScanSourceResult[] = []

  for (const source of COMPLIANCE_SOURCES) {
    const newText = await fetchText(source.url)
    if (!newText) {
      sources.push({ label: source.label, url: source.url, status: 'error' })
      continue
    }

    const newHash = computeHash(newText)

    const { data: lastSnapshot, error: lastSnapshotError } = await supabase
      .from('source_snapshots')
      .select('content_hash, id')
      .eq('url', source.url)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastSnapshotError) {
      console.error('Failed to fetch last snapshot:', lastSnapshotError.message)
      sources.push({ label: source.label, url: source.url, status: 'error' })
      continue
    }

    const { error: snapshotInsertError } = await supabase.from('source_snapshots').insert({
      url: source.url,
      label: source.label,
      content_hash: newHash,
    })
    if (snapshotInsertError) {
      console.error('Snapshot insert failed:', snapshotInsertError.message)
      sources.push({ label: source.label, url: source.url, status: 'error' })
      continue
    }

    if (!lastSnapshot || lastSnapshot.content_hash === newHash) {
      sources.push({ label: source.label, url: source.url, status: 'unchanged' })
      continue
    }

    changed++
    sources.push({ label: source.label, url: source.url, status: 'changed' })

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
    sources,
  })
}
