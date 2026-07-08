-- i18n P3: content_library um locale-Spalte erweitern
-- Issue #113 — Epic #117

ALTER TABLE public.content_library
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'de';

ALTER TABLE public.content_library
  ADD CONSTRAINT content_library_locale_check
  CHECK (locale IN ('de', 'en'));

-- Alten Index ersetzen: locale als Filterdimension hinzufügen
DROP INDEX IF EXISTS idx_content_library_guidance;
CREATE INDEX IF NOT EXISTS idx_content_library_guidance
  ON public.content_library (module, context_key, locale, is_published);
