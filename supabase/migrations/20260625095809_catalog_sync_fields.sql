-- Add sync tracking fields to catalog_sources
alter table catalog_sources
  add column if not exists sync_status  text not null default 'idle',
  add column if not exists last_sync_error text;
