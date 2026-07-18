-- Fix: EnrichmentSchema forderte .nullable() statt .nullish() für optionale
-- Felder — Sonnet ließ unsichere Felder gelegentlich ganz weg (undefined)
-- statt sie explizit auf null zu setzen, .nullable() akzeptierte das nicht
-- (ZOD_PARSE, Sentry 18.07.2026). Zurücksetzen, damit betroffene Vorschläge
-- mit dem jetzt toleranteren Schema einen sauberen neuen Versuch bekommen.
update catalog_suggestions set enrichment_status = 'none'
  where enrichment_status = 'failed';
