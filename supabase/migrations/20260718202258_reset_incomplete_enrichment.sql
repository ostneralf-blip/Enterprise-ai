-- Fix: Prompt beschrieb die Felder nur in Prosa ohne festes JSON-Schema —
-- Sonnet ließ vendor/description/website_url bei "Databricks" komplett aus
-- der Antwort weg statt sie auf null zu setzen (Bug-Report Daniel, 18.07.2026).
-- Prompt jetzt mit explizitem Beispiel-Objekt (alle 10 Schlüssel Pflicht).
-- Bereits als "done" markierte, aber lückenhafte Anreicherungen zurücksetzen,
-- damit sie mit dem verbesserten Prompt einen vollständigen Versuch bekommen.
update catalog_suggestions
  set enrichment_status = 'none'
  where enrichment_status = 'done'
    and (
      enrichment ->> 'vendor' is null
      or enrichment ->> 'description' is null
      or enrichment ->> 'website_url' is null
    );
