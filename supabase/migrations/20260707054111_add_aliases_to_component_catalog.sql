-- Aliases-Feld für Katalog-Komponenten
-- Ermöglicht Admin: produktspezifische Erkennungsbegriffe direkt am Eintrag pflegen
-- Beispiel: "SAP Joule" bekommt aliases ['joule', 'sap joule', 'joule ai assistant']
-- canvas-context.ts liest diese dynamisch → kein Code-Commit nötig bei neuen Produkten

ALTER TABLE public.component_catalog
  ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_component_catalog_aliases
  ON public.component_catalog USING gin(aliases);
