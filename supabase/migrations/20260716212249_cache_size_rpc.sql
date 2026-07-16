-- Schätzt die Gesamtgröße aller Cache-Einträge in Bytes (pg_column_size auf response-Spalte)
create or replace function cache_estimated_size_bytes()
returns bigint
language sql
security definer
as $$
  select coalesce(sum(pg_column_size(response)), 0)::bigint
  from ai_prompt_cache;
$$;

revoke all on function cache_estimated_size_bytes() from anon, authenticated;
