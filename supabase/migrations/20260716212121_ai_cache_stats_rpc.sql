-- RPC: hit/miss-Zähler atomar inkrementieren — aufgerufen via fire-and-forget in callLLM (#211)
create or replace function increment_cache_stat(p_module text, p_hit boolean)
returns void
language plpgsql
security definer
as $$
begin
  insert into ai_cache_stats (day, module, hits, misses)
  values (current_date, p_module, case when p_hit then 1 else 0 end, case when p_hit then 0 else 1 end)
  on conflict (day, module) do update
    set hits   = ai_cache_stats.hits   + excluded.hits,
        misses = ai_cache_stats.misses + excluded.misses;
end;
$$;

-- Nur Service Role darf die Funktion aufrufen
revoke all on function increment_cache_stat(text, boolean) from anon, authenticated;
