-- Korrektur: die vorige Migration setzte "anthropic.claude-sonnet-5" — von
-- Daniel direkt danach als eigener Tippfehler korrigiert. Tatsächlich korrekte
-- Bedrock-Modell-ID: anthropic.claude-sonnet-4-5-20250929-v1:0.
update app_settings set value = to_jsonb('anthropic.claude-sonnet-4-5-20250929-v1:0'::text), updated_at = now()
  where key = 'ai_model_bedrock_sonnet';

update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'failed';
