-- #181: Katalog Re-Dedup (15.07.2026 — idempotenter Follow-up nach Sync-Duplikaten)
-- Gleiche Logik wie 20260714194200, sicher wiederholbar.
-- Priorität: source='seed' > 'manual' > sonstige; bei Gleichstand: älteste id.

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(name))
      ORDER BY
        CASE source WHEN 'seed' THEN 0 WHEN 'manual' THEN 1 ELSE 2 END ASC,
        created_at ASC NULLS LAST,
        id ASC
    ) AS rn
  FROM component_catalog
)
DELETE FROM component_catalog
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Unique-Index sicherstellen (war ggf. noch nicht aktiv beim letzten Sync)
CREATE UNIQUE INDEX IF NOT EXISTS component_catalog_name_key_unique
  ON component_catalog (name_key);