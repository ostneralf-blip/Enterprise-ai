-- #191 Pass-1-Vorklassifikation: detection_blocklist + pass1_usage_log + canvas_synonyms-Erweiterung

-- ─── 1. canvas_synonyms: review_status + source ───────────────────────────────
ALTER TABLE public.canvas_synonyms
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin'
    CHECK (source IN ('admin', 'ai'));

-- Vorhandene Einträge (admin-angelegt, is_active=true) gelten als approved
UPDATE public.canvas_synonyms SET review_status = 'approved' WHERE source = 'admin';

-- ─── 2. detection_blocklist ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.detection_blocklist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  term       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  source     TEXT        NOT NULL DEFAULT 'ai'      CHECK (source IN ('ai', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT detection_blocklist_term_unique UNIQUE (term)
);

ALTER TABLE public.detection_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_blocklist" ON public.detection_blocklist
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_read_blocklist" ON public.detection_blocklist
  FOR SELECT TO authenticated
  USING (true);

-- Seed: Deutsche und englische Füllwörter (Soft-Block, confirmed = nie vorschlagen)
INSERT INTO public.detection_blocklist (term, status, source) VALUES
  ('sollen',        'confirmed', 'admin'),
  ('können',        'confirmed', 'admin'),
  ('müssen',        'confirmed', 'admin'),
  ('dürfen',        'confirmed', 'admin'),
  ('wollen',        'confirmed', 'admin'),
  ('möchten',       'confirmed', 'admin'),
  ('werden',        'confirmed', 'admin'),
  ('wurde',         'confirmed', 'admin'),
  ('einführen',     'confirmed', 'admin'),
  ('verbessern',    'confirmed', 'admin'),
  ('optimieren',    'confirmed', 'admin'),
  ('analysieren',   'confirmed', 'admin'),
  ('reduzieren',    'confirmed', 'admin'),
  ('ermöglichen',   'confirmed', 'admin'),
  ('nutzen',        'confirmed', 'admin'),
  ('lösung',        'confirmed', 'admin'),
  ('ansatz',        'confirmed', 'admin'),
  ('should',        'confirmed', 'admin'),
  ('could',         'confirmed', 'admin'),
  ('would',         'confirmed', 'admin'),
  ('enable',        'confirmed', 'admin'),
  ('improve',       'confirmed', 'admin'),
  ('reduce',        'confirmed', 'admin'),
  ('ensure',        'confirmed', 'admin')
ON CONFLICT (term) DO NOTHING;

-- ─── 3. pass1_usage_log (getrennt von ai_usage_log) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.pass1_usage_log (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
  call_count INT         NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, call_date)
);

ALTER TABLE public.pass1_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_pass1_log" ON public.pass1_usage_log
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomares Increment mit Limit-Guard — gibt neuen call_count zurück, null wenn Limit erreicht
CREATE OR REPLACE FUNCTION public.increment_pass1_usage(p_user UUID, p_limit INT)
RETURNS INT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.pass1_usage_log (user_id, call_date, call_count)
  VALUES (p_user, CURRENT_DATE, 1)
  ON CONFLICT (user_id, call_date)
    DO UPDATE SET
      call_count = pass1_usage_log.call_count + 1,
      updated_at = now()
    WHERE pass1_usage_log.call_count < p_limit
  RETURNING call_count;
$$;

-- ─── 4. app_settings: Pass-1-Limits ──────────────────────────────────────────
INSERT INTO public.app_settings (key, value, description) VALUES
  ('pass1_limit_free',       '5',   'Max. Pass-1-Klassifikations-Calls pro Tag (Free)'),
  ('pass1_limit_pro',        '50',  'Max. Pass-1-Klassifikations-Calls pro Tag (Pro)'),
  ('pass1_limit_enterprise', '200', 'Max. Pass-1-Klassifikations-Calls pro Tag (Enterprise)')
ON CONFLICT (key) DO NOTHING;
