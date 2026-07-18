-- Fix: die bisherige Sonnet-Modell-ID (eu.anthropic.claude-sonnet-4-6-20250514-v1:0,
-- EU-Cross-Region-Inference-Profile) ist in diesem AWS-Bedrock-Account nicht
-- freigeschaltet — Bedrock lehnte sie mit ValidationException ab (Sentry,
-- 18.07.2026, module=catalog_enrichment). Von Daniel bestätigte korrekte
-- Modell-ID: anthropic.claude-sonnet-5 (ohne EU-Routing-Präfix/Datums-Suffix).
update app_settings set value = to_jsonb('anthropic.claude-sonnet-5'::text), updated_at = now()
  where key = 'ai_model_bedrock_sonnet';

-- Die 2 durch den vorherigen after()-Bug hängengebliebenen (dann auf 'none'
-- zurückgesetzten) Vorschläge waren zwischenzeitlich erneut an der kaputten
-- Sonnet-ID gescheitert — nochmal zurücksetzen, damit sie mit der jetzt
-- korrekten ID einen sauberen Versuch bekommen.
update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'failed';
