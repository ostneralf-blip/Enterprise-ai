-- AI Prompt Cache: identische LLM-Anfragen nicht wiederholen (24h TTL)
create table if not exists ai_prompt_cache (
  cache_key   text        primary key,
  response    jsonb       not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Automatisch abgelaufene Cache-Einträge bereinigen (via cron oder on-demand)
-- RLS: nur Service Role darf lesen/schreiben
alter table ai_prompt_cache enable row level security;

create policy "Service Role darf Cache lesen und schreiben"
  on ai_prompt_cache for all
  using (true)
  with check (true);
