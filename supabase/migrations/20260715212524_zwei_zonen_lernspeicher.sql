-- #192 Zwei-Zonen-Lernspeicher: client_id-Scope, Evidence-Tracking, Promotion-Queue
-- Implementiert §5 des detection-learning-konzept.md.
-- Zone Client: client_id IS NOT NULL — auto-aktiv für den jeweiligen Client.
-- Zone Global: client_id IS NULL  — kuratiert über Admin-Promotion-Queue.

-- ─── 1. canvas_synonyms: neue Spalten ────────────────────────────────────────
ALTER TABLE public.canvas_synonyms
  ADD COLUMN IF NOT EXISTS client_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS evidence_count  int         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_seen_at    timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS avg_confidence  numeric(4,3);

-- review_status + source: falls nicht schon von #191 vorhanden (idempotent)
ALTER TABLE public.canvas_synonyms
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'promoted')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin'
    CHECK (source IN ('admin', 'ai'));

-- ─── 2. Unique-Constraint umbauen (global + client separat) ──────────────────
-- Alte globale UNIQUE (term, synonym) muss weg — client_id differenziert jetzt.
ALTER TABLE public.canvas_synonyms DROP CONSTRAINT IF EXISTS canvas_synonyms_unique;

-- Global: höchstens ein Eintrag pro (term, synonym) ohne client_id
CREATE UNIQUE INDEX IF NOT EXISTS canvas_synonyms_global_unique
  ON public.canvas_synonyms (term, synonym)
  WHERE client_id IS NULL;

-- Client: höchstens ein Eintrag pro (term, synonym, client_id)
CREATE UNIQUE INDEX IF NOT EXISTS canvas_synonyms_client_unique
  ON public.canvas_synonyms (term, synonym, client_id)
  WHERE client_id IS NOT NULL;

-- Detection-Merge-Index: schnelle Abfrage aktiver Client-Synonyme
CREATE INDEX IF NOT EXISTS canvas_synonyms_client_active_idx
  ON public.canvas_synonyms (client_id, synonym_type)
  WHERE is_active = true;

-- ─── 3. RLS-Update: Client liest eigene Zeilen + globale aktive ──────────────
-- Gate F: kein USING (true) — Client sieht nur eigene + globale aktive Einträge.
DROP POLICY IF EXISTS "authenticated_read" ON public.canvas_synonyms;

CREATE POLICY "authenticated_read" ON public.canvas_synonyms
  FOR SELECT TO authenticated
  USING (
    (client_id IS NULL AND is_active = true)    -- globale aktive Einträge
    OR client_id = auth.uid()                    -- eigene Client-Einträge (alle Status)
  );

-- ─── 4. app_settings: Promotion-Schwellen (ohne Deploy justierbar) ───────────
INSERT INTO public.app_settings (key, value) VALUES
  ('promotion_min_clients',    '{"value": 3}'::jsonb),
  ('promotion_min_confidence', '{"value": 0.80}'::jsonb)
ON CONFLICT (key) DO NOTHING;
