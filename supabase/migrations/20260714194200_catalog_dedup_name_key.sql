-- #181: Katalog-Dedup + name_key-Unique-Index (14.07.2026)
-- Problem: Unique-Constraint war (name, vendor) → gleicher Name mit abweichendem Vendor-String
-- erzeugte Duplikate (z.B. "MLflow (Linux Foundation)" + "MLflow (Databricks)").
-- Lösung: Kanonischer Key lower(trim(name)) als generated column + Unique-Index darauf.

-- Step 1: Duplikate bereinigen — keep canonical:
--         Priorität: source='seed' > 'manual' > sonstige; bei Gleichstand: älteste id
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

-- Step 2: Alten (name, vendor)-Constraint und Index entfernen
ALTER TABLE component_catalog
  DROP CONSTRAINT IF EXISTS component_catalog_name_vendor_key;

DROP INDEX IF EXISTS component_catalog_name_vendor_idx;

-- Step 3: Generated column für kanonischen Matching-Key
ALTER TABLE component_catalog
  ADD COLUMN IF NOT EXISTS name_key text
    GENERATED ALWAYS AS (lower(trim(name))) STORED;

-- Step 4: Unique-Index auf name_key — verhindert Duplikate strukturell
CREATE UNIQUE INDEX IF NOT EXISTS component_catalog_name_key_unique
  ON component_catalog (name_key);
