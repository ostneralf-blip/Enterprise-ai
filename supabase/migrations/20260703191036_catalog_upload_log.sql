create table if not exists catalog_upload_log (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references auth.users(id) on delete set null,
  filename      text        not null,
  format        text        not null,
  row_count     integer     not null default 0,
  vendor_override text,
  layer_override  text,
  source        text        not null check (source in ('upload', 'seed')),
  uploaded_at   timestamptz not null default now()
);

alter table catalog_upload_log enable row level security;

create policy "admin_select_upload_log"
  on catalog_upload_log for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admin_insert_upload_log"
  on catalog_upload_log for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
