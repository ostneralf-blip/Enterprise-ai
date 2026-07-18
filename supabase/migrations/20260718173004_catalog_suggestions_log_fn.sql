-- Protokolliert einen KI-Komponentenvorschlag ohne Katalog-Treffer, oder erhöht
-- occurrence_count, falls derselbe (bereinigte) Name bereits als "pending"
-- vorliegt. Analog zu increment_cache_stat() — Service-Role-only, da der
-- Aufruf aus der Analysis-Route (Server, Admin-Client) erfolgt, nicht von
-- regulären Nutzern.
create or replace function log_catalog_suggestion(
  p_name    text,
  p_module  text,
  p_section text,
  p_context jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into catalog_suggestions (suggested_name, module, section, context, occurrence_count, status, last_seen_at)
  values (p_name, p_module, p_section, p_context, 1, 'pending', now())
  on conflict (lower(trim(suggested_name))) where status = 'pending'
  do update
    set occurrence_count = catalog_suggestions.occurrence_count + 1,
        last_seen_at     = now(),
        -- Letzten Kontext festhalten, damit ein Admin die aktuellste Architektur sieht.
        context          = excluded.context;
end;
$$;

revoke all on function log_catalog_suggestion(text, text, text, jsonb) from anon, authenticated;
