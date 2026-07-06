-- Wissens-Layer: content_library um kontextuelle Steuerung erweitern
-- Issue #77 — Sprint 12

ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS context_key    TEXT,
  ADD COLUMN IF NOT EXISTS display_order  INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published   BOOL NOT NULL DEFAULT true;

-- Bestehende Einträge normieren: freie category-Werte auf gültiges Set mappen
UPDATE public.content_library
  SET category = 'hinweis'
  WHERE category NOT IN ('definition','best_practice','anti_pattern','policy_template','checkliste','hinweis');

ALTER TABLE public.content_library
  ADD CONSTRAINT content_library_category_check
  CHECK (category IN ('definition','best_practice','anti_pattern','policy_template','checkliste','hinweis'));

-- Abfrage-Index für GuidancePanel (module + context_key + is_published)
CREATE INDEX IF NOT EXISTS idx_content_library_guidance
  ON public.content_library (module, context_key, is_published);

-- RLS: authenticated_read nur veröffentlichte Inhalte, Admins sehen alles via admin_all
DROP POLICY IF EXISTS "authenticated_read" ON public.content_library;
CREATE POLICY "authenticated_read" ON public.content_library
  FOR SELECT TO authenticated
  USING (is_published = true OR public.is_admin());
