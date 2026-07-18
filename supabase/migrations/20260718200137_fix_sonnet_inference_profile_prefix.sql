-- Fix: Bedrock lehnte den bloßen On-Demand-Modell-Aufruf ab
-- ("Invocation of model ID ... with on-demand throughput isn't supported.
-- Retry your request with the ID or ARN of an inference profile that
-- contains this model.") — genau wie Haiku (eu.anthropic.claude-haiku-...)
-- braucht dieses Sonnet-Modell das "eu."-Cross-Region-Inference-Profile-
-- Präfix statt der nackten Modell-ID.
update app_settings set value = to_jsonb('eu.anthropic.claude-sonnet-4-5-20250929-v1:0'::text), updated_at = now()
  where key = 'ai_model_bedrock_sonnet';

update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'failed';
