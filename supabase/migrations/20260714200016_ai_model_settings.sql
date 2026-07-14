-- #183: KI-Modell-Auswahl konfigurierbar (14.07.2026)
-- Neue Einträge in app_settings — kein Schema-Change, bestehende key/value-Struktur

-- value-Spalte ist JSON → Strings müssen JSON-encoded gespeichert werden (doppelte Anführungszeichen)
insert into app_settings (key, value, description) values
  ('ai_model_bedrock_haiku',
   '"eu.anthropic.claude-haiku-4-5-20251001-v1:0"',
   'Bedrock EU Inference Profile ID für Claude Haiku (Priorität: Env-Var BEDROCK_MODEL_HAIKU > DB > Code-Default)'),
  ('ai_model_bedrock_sonnet',
   '"eu.anthropic.claude-sonnet-4-6-20250514-v1:0"',
   'Bedrock EU Inference Profile ID für Claude Sonnet (Priorität: Env-Var BEDROCK_MODEL_SONNET > DB > Code-Default)'),
  ('ai_model_direct_fallback',
   '"claude-haiku-4-5-20251001"',
   'Anthropic Direct API Fallback-Modell-ID (z.B. claude-haiku-4-5-20251001 oder claude-sonnet-4-6)')
on conflict (key) do nothing;
