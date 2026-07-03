alter table profiles
  add column if not exists guided_path_reset_at timestamptz;
