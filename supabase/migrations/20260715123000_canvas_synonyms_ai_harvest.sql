-- #188: KI-Erkennungs-Harvesting — Enrichment-Ergebnisse als Synonym-Kandidaten.
-- Detection-Konsumenten (buildMergedVendorAliases etc.) filtern weiterhin
-- AUSSCHLIESSLICH über is_active: Kandidaten (pending, is_active=false) ändern
-- das Erkennungsverhalten erst nach Admin-Freigabe. Kein Auto-Approve (#181-Lehre).

ALTER TABLE public.canvas_synonyms
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS evidence_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.canvas_synonyms
  ADD CONSTRAINT canvas_synonyms_source_check
    CHECK (source IN ('admin', 'ai')),
  ADD CONSTRAINT canvas_synonyms_review_status_check
    CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Schneller Zugriff auf offene Kandidaten im Admin-Review
CREATE INDEX IF NOT EXISTS idx_canvas_synonyms_pending
  ON public.canvas_synonyms (review_status)
  WHERE review_status = 'pending';
