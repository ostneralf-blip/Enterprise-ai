-- #171: Vendor-Profile-Bereinigung + Duplikat-Löschung (13.07.2026)
-- Root cause: Katalog-Sync/-Upload hat Microsoft als Vendor für Fremdkomponenten eingetragen.
-- Alle betroffenen Komponenten haben bereits korrekte Einträge → Duplikate löschen genügt.

-- Alle Einträge mit vendor='Microsoft' (case-insensitiv) löschen,
-- bei denen ein anderer Eintrag mit gleichem Namen bereits existiert.
DELETE FROM component_catalog a
WHERE lower(a.vendor) = 'microsoft'
  AND EXISTS (
    SELECT 1 FROM component_catalog b
    WHERE lower(b.name) = lower(a.name)
      AND b.id != a.id
  );

-- Sicherheitsnetz: Falls eine Komponente nur als Microsoft-Eintrag existiert (kein korrekter),
-- Vendor explizit korrigieren (betrifft nur Zeilen die oben nicht gelöscht wurden).
UPDATE component_catalog SET vendor = 'Evidently AI'          WHERE lower(name) = 'evidently ai'                      AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'Open Source / Collate' WHERE lower(name) = 'openmetadata'                     AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'Red Hat'               WHERE lower(name) = 'keycloak'                         AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'SAP'                   WHERE lower(name) = 'sap ai core'                      AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'SAP'                   WHERE lower(name) = 'sap ai launchpad'                 AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'SAP'                   WHERE lower(name) = 'sap business technology platform' AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'Linux Foundation'      WHERE lower(name) = 'mlflow'                           AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'Databricks'            WHERE lower(name) = 'databricks'                       AND lower(vendor) = 'microsoft';
UPDATE component_catalog SET vendor = 'Snowflake'             WHERE lower(name) = 'snowflake'                        AND lower(vendor) = 'microsoft';
