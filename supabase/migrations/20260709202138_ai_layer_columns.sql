-- AI-Layer: Spalten für persistierte AI-Ergebnisse + Usage-Tracking

-- Canvas: AI-Enrichment Ergebnis speichern
alter table canvases
  add column if not exists ai_enrichment    jsonb,
  add column if not exists ai_model         text,
  add column if not exists ai_generated_at  timestamptz;

-- Architectures: AI-Narrative Ergebnis speichern
alter table architectures
  add column if not exists ai_narrative     jsonb,
  add column if not exists ai_model         text,
  add column if not exists ai_generated_at  timestamptz;

-- Usage-Log: 5 AI-Calls pro Nutzer pro Tag tracken
create table if not exists ai_usage_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  call_date  date not null default current_date,
  call_count int  not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, call_date)
);

alter table ai_usage_log enable row level security;

create policy "Nutzer sehen nur eigene Usage-Logs"
  on ai_usage_log for select
  using (auth.uid() = user_id);

create policy "Service Role darf Usage upserten"
  on ai_usage_log for all
  using (true)
  with check (true);
