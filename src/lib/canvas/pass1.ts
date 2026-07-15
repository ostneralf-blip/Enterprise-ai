// Pass-1-Konsequenz-Routing (#191) — pure Guards + DB-Writes
// Baut auf detection.ts + field-priors.ts + pass0.ts auf.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Pass1TermResult } from '@/lib/ai/schemas'
import { VENDOR_ALIASES } from './detection'

// ─── Pure Guards (testbar ohne DB) ────────────────────────────────────────────

/** Guard 1: Term muss wörtlich im Canvas-Text stehen — verhindert Prompt-Injection. */
export function checkLiteralPresence(term: string, canvasText: string): boolean {
  return canvasText.toLowerCase().includes(term.toLowerCase())
}

/** Guard 2: Angegebener Vendor muss in VENDOR_ALIASES bekannt sein. */
export function checkCanonicalVendor(vendor: string | null | undefined): boolean {
  if (!vendor) return false
  return Object.keys(VENDOR_ALIASES).some(
    v => v.toLowerCase() === vendor.toLowerCase(),
  )
}

export interface SynonymDecision {
  ok: boolean
  reason?: string
}

/**
 * Entscheidet, ob ein klassifizierter Term als Synonym-Kandidat eingetragen werden darf.
 * Guards: class === 'produkt' + wörtlich im Text + kanonischer Vendor.
 */
export function shouldAddSynonym(result: Pass1TermResult, canvasText: string): SynonymDecision {
  if (result.class !== 'produkt') {
    return { ok: false, reason: `class=${result.class} — nur 'produkt' wird als Synonym gespeichert` }
  }
  if (!checkCanonicalVendor(result.vendor)) {
    return { ok: false, reason: `Vendor '${result.vendor}' ist nicht in VENDOR_ALIASES` }
  }
  if (!checkLiteralPresence(result.term, canvasText)) {
    return { ok: false, reason: `'${result.term}' nicht wörtlich im Canvas-Text` }
  }
  return { ok: true }
}

/** Entscheidet, ob ein Term als Block-Kandidat (detection_blocklist) eingetragen werden soll. */
export function shouldAddToBlocklist(result: Pass1TermResult): boolean {
  return result.class === 'fuellwort'
}

// ─── DB-Writes ────────────────────────────────────────────────────────────────

export interface ConsequenceStats {
  synonymsPending: number
  blocklistPending: number
  discarded: number
}

/**
 * Wendet Pass-1-Konsequenzen auf klassifizierte Terme an.
 * - produkt + Guards → canvas_synonyms (is_active=false, review_status=pending, source=ai)
 * - fuellwort → detection_blocklist (status=pending, source=ai)
 * - projekt_eigenname / mehrdeutig / capability → verwerfen
 * Guards werden IMMER geprüft — nie is_active/review_status überschreiben.
 */
export async function applyConsequences(
  results: Pass1TermResult[],
  canvasText: string,
  supabase: SupabaseClient,
): Promise<ConsequenceStats> {
  const stats: ConsequenceStats = { synonymsPending: 0, blocklistPending: 0, discarded: 0 }

  for (const r of results) {
    if (shouldAddToBlocklist(r)) {
      await supabase
        .from('detection_blocklist')
        .upsert({ term: r.term.toLowerCase(), status: 'pending', source: 'ai' }, { onConflict: 'term', ignoreDuplicates: true })
      stats.blocklistPending++
      continue
    }

    const decision = shouldAddSynonym(r, canvasText)
    if (decision.ok && r.vendor) {
      // is_active = false — aktiviert erst nach Admin-Freigabe
      // ON CONFLICT DO NOTHING — nie is_active oder review_status überschreiben
      await supabase
        .from('canvas_synonyms')
        .upsert(
          { term: r.vendor, synonym: r.term.toLowerCase(), synonym_type: 'vendor', is_active: false, review_status: 'pending', source: 'ai' },
          { onConflict: 'term,synonym', ignoreDuplicates: true },
        )
      stats.synonymsPending++
      continue
    }

    stats.discarded++
  }

  return stats
}
