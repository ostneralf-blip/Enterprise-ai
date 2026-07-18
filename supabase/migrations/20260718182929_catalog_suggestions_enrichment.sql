-- KI-Produktanreicherung für catalog_suggestions (18.07.2026): wenn ein neuer
-- KI-Vorschlag ohne Katalog-Treffer zum ersten Mal auftritt, wird asynchron ein
-- eigener (nicht dem Nutzer-Kontingent zugerechneter) LLM-Call ausgelöst, der
-- Herkunftsfirma, Kategorie, Architektur-Layer, DSGVO-Status, EU-AI-Act-Risiko,
-- Kurzbeschreibung und Hersteller-Link ermittelt — landet hier, damit der Admin
-- im "KI-Vorschläge"-Tab direkt entscheiden kann, statt selbst recherchieren zu
-- müssen (u. a. bei mehrdeutigen Herstellernamen wie "Databricks").
alter table catalog_suggestions
  add column if not exists enrichment jsonb,
  add column if not exists enrichment_status text not null default 'none',
  add column if not exists enriched_at timestamptz;

comment on column catalog_suggestions.enrichment is
  'Strukturierte Produkt-Metadaten aus dem Anreicherungs-Call (resolved_name, vendor, category, architecture_layer, cloud_provider, hosting, dsgvo_status, eu_ai_act_risk, description, website_url)';
comment on column catalog_suggestions.enrichment_status is
  'none | pending | done | failed — none: noch nicht ausgelöst (z. B. Wiederholung eines bereits bekannten Vorschlags)';
