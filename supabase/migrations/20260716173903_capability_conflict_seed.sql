-- #199: capability-Spalte für Capability-Konflikt-Erkennung
ALTER TABLE component_catalog ADD COLUMN IF NOT EXISTS capability text;

-- Seed: Conversational Copilot — SAP Joule vs. Microsoft Copilot Studio
UPDATE component_catalog
  SET capability = 'conversational_copilot'
WHERE lower(name) IN ('sap joule', 'microsoft copilot studio', 'microsoft 365 copilot');

UPDATE component_catalog
  SET incompatible_with = array_append(COALESCE(incompatible_with, '{}'), 'Microsoft Copilot Studio')
WHERE lower(name) = 'sap joule'
  AND NOT ('Microsoft Copilot Studio' = ANY(COALESCE(incompatible_with, '{}')));

UPDATE component_catalog
  SET incompatible_with = array_append(COALESCE(incompatible_with, '{}'), 'SAP Joule')
WHERE lower(name) IN ('microsoft copilot studio', 'microsoft 365 copilot')
  AND NOT ('SAP Joule' = ANY(COALESCE(incompatible_with, '{}')));

-- Seed: Identity Provider — Keycloak vs. Microsoft Entra ID
UPDATE component_catalog
  SET capability = 'identity_provider'
WHERE lower(name) IN ('keycloak', 'microsoft entra id', 'azure active directory');

-- Seed: API Gateway
UPDATE component_catalog
  SET capability = 'api_gateway'
WHERE lower(name) IN ('kong gateway', 'kong', 'azure api management', 'aws api gateway', 'amazon api gateway');

-- Seed: Data Catalog
UPDATE component_catalog
  SET capability = 'data_catalog'
WHERE lower(name) IN ('microsoft purview', 'aws datazone', 'aws glue data catalog', 'sap mdg');
