-- Free-Tier Tageslimit fürs Speichern von Ergebnissen (Issue #222).
-- Free darf speichern, aber max. N neue Ergebnisse pro Tag PRO TOOL.
-- Gespiegelt an ai_usage_log / increment_ai_usage (gleiche atomare UPSERT-Mechanik),
-- erweitert um eine module-Dimension (5/Tag je Tool, nicht global).

create table if not exists save_usage_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  save_date  date not null default current_date,
  module     text not null,
  save_count int  not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, save_date, module)
);

alter table save_usage_log enable row level security;

create policy "Nutzer sehen nur eigene Save-Usage-Logs"
  on save_usage_log for select
  using (auth.uid() = user_id);

create policy "Service Role darf Save-Usage upserten"
  on save_usage_log for all
  using (true)
  with check (true);

-- Atomares Increment via UPSERT mit WHERE-Guard (verhindert Race Conditions bei
-- parallelen Requests). Gibt neuen save_count zurück, null wenn das Limit für
-- (user, heute, module) bereits erreicht ist.
create or replace function increment_save_usage(p_user uuid, p_module text, p_limit int)
returns int
language sql
security definer
as $$
  insert into save_usage_log (user_id, save_date, module, save_count)
  values (p_user, current_date, p_module, 1)
  on conflict (user_id, save_date, module)
    do update set
      save_count = save_usage_log.save_count + 1,
      updated_at = now()
    where save_usage_log.save_count < p_limit
  returning save_count;
$$;
