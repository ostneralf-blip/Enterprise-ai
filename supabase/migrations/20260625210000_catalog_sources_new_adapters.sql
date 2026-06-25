-- Neue Katalog-Quellen für die erweiterten Sync-Adapter (Issue #44)
-- Quellen mit API-Key-Pflicht starten mit is_active = false,
-- damit kein fehlgeschlagener Sync ohne konfigurierten Key ausgelöst wird.

INSERT INTO catalog_sources (name, type, url, sync_interval_days, is_active, config) VALUES
  ('OpenAI Models',    'openai_api',    NULL,                                                      7,  false, '{}'::jsonb),
  ('Anthropic Models', 'anthropic_api', NULL,                                                      7,  false, '{}'::jsonb),
  ('Mistral AI Models','mistral_api',   NULL,                                                      7,  false, '{}'::jsonb),
  ('NVIDIA NGC',       'nvidia_ngc',    'https://api.ngc.nvidia.com/v2/models',                    14, false, '{}'::jsonb),
  ('PyPI AI-Pakete',   'pypi',          'https://pypi.org/pypi',                                   30, true,  '{}'::jsonb),
  ('OpenML',           'openml',        'https://www.openml.org/api/v1/json/flow/list',            30, true,  '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;
