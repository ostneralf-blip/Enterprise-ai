// Pass-2-Lernspeicher (#192) — Zone-Client auto-aktiv + Evidence-Tracking.
// Persistiert Pass-1-Ergebnisse mit client_id-Scope:
//   - Hohe Konfidenz  → is_active=true  (wirkt sofort, nur für diesen Client)
//   - Niedrige Konfidenz → is_active=false (pending, kein sofortiger Effekt)
//   - Globaler Eintrag vorhanden → nur Evidence-Count aktualisieren
// Guards (wörtlich-im-Text + kanonischer-Vendor) werden aus Pass 1 übernommen.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Pass1TermResult } from '@/lib/ai/schemas'
import { shouldAddSynonym } from './pass1'

/** Schwelle für auto-aktive Client-Einträge. Konfigurierbar via app_settings. */
export const HIGH_CONF_THRESHOLD_DEFAULT = 0.80

export interface Pass2Stats {
  autoActive: number     // neu eingefügt, is_active=true
  pendingClient: number  // neu eingefügt, is_active=false
  evidenceUpdated: number // bestehend (global oder client), nur evidence_count erhöht
  discarded: number
}

function roundConf(n: number): number {
  return Math.round(n * 1000) / 1000
}

function updatedAvg(oldAvg: number | null, oldCount: number, newConf: number): number {
  const base = oldAvg ?? newConf
  return roundConf((base * (oldCount - 1) + newConf) / oldCount)
}

/**
 * Persistiert Pass-1-Ergebnisse zone-aware in canvas_synonyms.
 * Muss nach applyConsequences (pass1.ts) aufgerufen werden.
 * Schreibt immer mit clientId — NIE global (das ist Aufgabe der Admin-Promotion).
 */
export async function applyPass2(
  results: Pass1TermResult[],
  clientId: string,
  canvasText: string,
  supabase: SupabaseClient,
  highConfThreshold: number = HIGH_CONF_THRESHOLD_DEFAULT,
): Promise<Pass2Stats> {
  const stats: Pass2Stats = { autoActive: 0, pendingClient: 0, evidenceUpdated: 0, discarded: 0 }

  for (const r of results) {
    const { ok } = shouldAddSynonym(r, canvasText)
    if (!ok || !r.vendor) { stats.discarded++; continue }

    const synonymLower = r.term.toLowerCase()
    const confidence = r.confidence ?? 0

    // 1. Globaler aktiver Eintrag vorhanden? → nur Evidence aktualisieren
    const { data: globalRow } = await supabase
      .from('canvas_synonyms')
      .select('id, evidence_count, avg_confidence')
      .eq('term', r.vendor)
      .eq('synonym', synonymLower)
      .is('client_id', null)
      .eq('is_active', true)
      .maybeSingle()

    if (globalRow) {
      const newCount = (globalRow.evidence_count ?? 1) + 1
      await supabase.from('canvas_synonyms').update({
        evidence_count: newCount,
        last_seen_at: new Date().toISOString(),
        avg_confidence: updatedAvg(globalRow.avg_confidence, newCount, confidence),
      }).eq('id', globalRow.id)
      stats.evidenceUpdated++
      continue
    }

    // 2. Eigener Client-Eintrag vorhanden? → Evidence aktualisieren (nie is_active/review_status ändern)
    const { data: clientRow } = await supabase
      .from('canvas_synonyms')
      .select('id, evidence_count, avg_confidence')
      .eq('term', r.vendor)
      .eq('synonym', synonymLower)
      .eq('client_id', clientId)
      .maybeSingle()

    if (clientRow) {
      const newCount = (clientRow.evidence_count ?? 1) + 1
      await supabase.from('canvas_synonyms').update({
        evidence_count: newCount,
        last_seen_at: new Date().toISOString(),
        avg_confidence: updatedAvg(clientRow.avg_confidence, newCount, confidence),
      }).eq('id', clientRow.id)
      stats.evidenceUpdated++
      continue
    }

    // 3. Neuer Client-Eintrag — Zone Client
    const isActive = confidence >= highConfThreshold
    await supabase.from('canvas_synonyms').insert({
      term:          r.vendor,
      synonym:       synonymLower,
      synonym_type:  'vendor',
      is_active:     isActive,
      review_status: isActive ? 'approved' : 'pending',
      source:        'ai',
      client_id:     clientId,
      evidence_count: 1,
      last_seen_at:  new Date().toISOString(),
      avg_confidence: roundConf(confidence),
    })

    if (isActive) stats.autoActive++
    else stats.pendingClient++
  }

  return stats
}
