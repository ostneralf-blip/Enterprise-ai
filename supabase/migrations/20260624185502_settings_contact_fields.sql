alter table profiles
  add column if not exists phone   text,
  add column if not exists mobile  text,
  add column if not exists street  text,
  add column if not exists zip     text,
  add column if not exists city    text;
