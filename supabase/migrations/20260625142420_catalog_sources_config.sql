-- config-Feld für quellspezifische Einstellungen (z.B. API-Key)
ALTER TABLE catalog_sources
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- CNCF-URL auf funktionierende GitHub-Raw-YAML-URL aktualisieren
UPDATE catalog_sources
  SET url = 'https://raw.githubusercontent.com/cncf/landscape/HEAD/landscape.yml'
  WHERE type = 'cncf_landscape';
