-- Erweitert ai_usage_log um Provenienz-Spalten für AI-Audit
alter table ai_usage_log
  add column if not exists last_provider text,
  add column if not exists fail_count    int not null default 0;

-- Atomares Increment via UPSERT mit WHERE-Guard: verhindert Race Condition
-- bei parallelen Requests. Gibt neuen call_count zurück, null wenn Limit erreicht.
create or replace function increment_ai_usage(p_user uuid, p_limit int)
returns int
language sql
security definer
as $$
  insert into ai_usage_log (user_id, call_date, call_count)
  values (p_user, current_date, 1)
  on conflict (user_id, call_date)
    do update set
      call_count = ai_usage_log.call_count + 1,
      updated_at = now()
    where ai_usage_log.call_count < p_limit
  returning call_count;
$$;
