-- Fix: architecture_layer/dsgvo_status/eu_ai_act_risk waren als strikte
-- z.enum() geparst — ein einzelner Near-Miss-Wert von Sonnet (z. B.
-- "integration" statt einem der 7 Layer) verwarf die gesamte Antwort
-- (ZOD_PARSE, Sentry 18.07.2026). Jetzt lose als String geparst und per
-- Synonym-Mapping auf die erlaubten Werte normalisiert. Zurücksetzen für
-- einen sauberen Neuversuch.
update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'failed';
