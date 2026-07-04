-- Snapshot-Spalte für Soft-Restore: speichert die Komponenten eines Uploads als JSONB
alter table catalog_upload_log add column if not exists snapshot jsonb;
