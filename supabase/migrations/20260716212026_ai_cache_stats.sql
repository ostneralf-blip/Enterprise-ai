-- KI-Cache-Statistiken: tägliche hit/miss-Zähler pro Modul (#211)
-- Inkrementiert fire-and-forget in callLLM nach Cache-Treffer/-Verfehlung.
create table if not exists ai_cache_stats (
  day     date not null default current_date,
  module  text not null default 'unknown',
  hits    int  not null default 0,
  misses  int  not null default 0,
  primary key (day, module)
);

-- Nur Service Role darf schreiben/lesen (keine User-Policy)
alter table ai_cache_stats enable row level security;
revoke all on ai_cache_stats from anon, authenticated;
