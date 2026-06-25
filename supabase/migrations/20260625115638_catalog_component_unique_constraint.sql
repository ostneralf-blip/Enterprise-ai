-- Unique constraint für ON CONFLICT (name, vendor) beim Upsert
-- NULLS NOT DISTINCT: zwei Zeilen mit (name, NULL) kollidieren (Postgres 15+)
ALTER TABLE component_catalog
  ADD CONSTRAINT component_catalog_name_vendor_key
  UNIQUE NULLS NOT DISTINCT (name, vendor);
