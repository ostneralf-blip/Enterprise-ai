-- canvas_synonyms: Admin-konfigurierbare Erkennungsbegriffe für den Canvas-Kontext
-- synonym_type:
--   'vendor'   → erweitert VENDOR_ALIASES[term] (z.B. term='Microsoft', synonym='navision')
--   'category' → erweitert PLATFORM_CATEGORY_KEYWORDS[term] (z.B. term='erp', synonym='wawi')
--   'usecase'  → erweitert BASE_VOCAB[term] (z.B. term='predictive', synonym='bedarfsplanung')

CREATE TABLE IF NOT EXISTS public.canvas_synonyms (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  term         TEXT        NOT NULL,
  synonym      TEXT        NOT NULL,
  synonym_type TEXT        NOT NULL DEFAULT 'vendor',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT canvas_synonyms_type_check
    CHECK (synonym_type IN ('vendor', 'category', 'usecase')),
  CONSTRAINT canvas_synonyms_unique UNIQUE (term, synonym)
);

CREATE INDEX IF NOT EXISTS idx_canvas_synonyms_active
  ON public.canvas_synonyms (synonym_type, is_active);

ALTER TABLE public.canvas_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.canvas_synonyms
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "authenticated_read" ON public.canvas_synonyms
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Trigger für updated_at nicht nötig (keine updated_at-Spalte), created_at genügt

-- Beispiel-Seed: zeigt das Muster für eigene Ergänzungen
INSERT INTO public.canvas_synonyms (term, synonym, synonym_type) VALUES
  ('Microsoft',  'navision',          'vendor'),
  ('Microsoft',  'dynamics nav',      'vendor'),
  ('SAP',        'joule',             'vendor'),
  ('SAP',        'rise with sap',     'vendor'),
  ('erp',        'warenwirtschaft',   'category'),
  ('erp',        'finanzbuchhaltung', 'category'),
  ('predictive', 'bedarfsplanung',    'usecase'),
  ('generative', 'wissensdatenbank',  'usecase')
ON CONFLICT (term, synonym) DO NOTHING;
