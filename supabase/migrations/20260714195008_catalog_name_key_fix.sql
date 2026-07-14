-- #181 Fix: name_key von GENERATED ALWAYS auf reguläre Spalte + Trigger umstellen
-- Root cause: PostgREST generiert "DO UPDATE SET name_key = EXCLUDED.name_key" —
-- das schlägt fehl weil GENERATED ALWAYS Spalten nicht explizit gesetzt werden dürfen.
-- Lösung: reguläre Spalte + BEFORE-Trigger, Unique CONSTRAINT (nicht nur Index).

-- Step 1: GENERATED ALWAYS Expression entfernen (PG 15+, idempotent)
ALTER TABLE component_catalog ALTER COLUMN name_key DROP EXPRESSION IF EXISTS;

-- Step 2: Spalte anlegen falls sie durch Schritt 1 noch nicht existiert
ALTER TABLE component_catalog ADD COLUMN IF NOT EXISTS name_key text;

-- Step 3: Fehlende Werte befüllen
UPDATE component_catalog SET name_key = lower(trim(name)) WHERE name_key IS NULL;

-- Step 4: NOT NULL erzwingen
ALTER TABLE component_catalog ALTER COLUMN name_key SET NOT NULL;

-- Step 5: Alten Index und alten Constraint entfernen (Sicherheitsnetz)
DROP INDEX IF EXISTS component_catalog_name_key_unique;
ALTER TABLE component_catalog DROP CONSTRAINT IF EXISTS component_catalog_name_key_unique;

-- Step 6: Unique CONSTRAINT — PostgREST erkennt ON CONFLICT nur auf echten Constraints
ALTER TABLE component_catalog
  ADD CONSTRAINT component_catalog_name_key_unique UNIQUE (name_key);

-- Step 7: Trigger hält name_key bei jedem INSERT/UPDATE aktuell
CREATE OR REPLACE FUNCTION catalog_sync_name_key()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.name_key := lower(trim(NEW.name));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_name_key ON component_catalog;
CREATE TRIGGER sync_name_key
  BEFORE INSERT OR UPDATE OF name ON component_catalog
  FOR EACH ROW EXECUTE FUNCTION catalog_sync_name_key();
