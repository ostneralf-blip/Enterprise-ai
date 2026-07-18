-- Fix: mehrfach verschachtelt JSON-kodierte Bedrock-Modell-IDs in app_settings
-- (18.07.2026, Recurrence des #Bedrock-ValidationException-Bugs vom selben Tag).
-- Vermutlich durch wiederholtes Speichern über das Admin-Panel, bevor die
-- unwrapJsonString()-Absicherung griff, auf 3+ Kodierungsebenen angewachsen —
-- AWS Bedrock lehnte die dadurch kaputte Modell-ID mit ValidationException
-- ("The provided model identifier is invalid.") ab, betraf sowohl reguläre
-- Architektur-Analysen (Haiku) als auch die neue Katalog-Anreicherung (Sonnet).
-- to_jsonb() auf den bekannten Klartext-Werten erzeugt garantiert genau die
-- eine Kodierungsebene, die der App-Code (getStringSetting + unwrapJsonString)
-- erwartet — unabhängig davon, wie die Verschachtelung ursprünglich entstand.
update app_settings set value = to_jsonb('eu.anthropic.claude-haiku-4-5-20251001-v1:0'::text), updated_at = now()
  where key = 'ai_model_bedrock_haiku';
update app_settings set value = to_jsonb('eu.anthropic.claude-sonnet-4-6-20250514-v1:0'::text), updated_at = now()
  where key = 'ai_model_bedrock_sonnet';
update app_settings set value = to_jsonb('claude-haiku-4-5-20251001'::text), updated_at = now()
  where key = 'ai_model_direct_fallback';
