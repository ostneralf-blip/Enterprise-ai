-- Add version_info column to component_catalog for L2 detail view (Sprint 22 / Issue #151)
ALTER TABLE component_catalog ADD COLUMN IF NOT EXISTS version_info jsonb;
