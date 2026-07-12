-- Zentrale Key-Value-Tabelle für Business-Logik-Konfiguration.
-- Werte aus dieser Tabelle überschreiben Code-Defaults (config/tiers.ts).
-- Nur Service Role darf lesen/schreiben — kein direkter Client-Zugriff.
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

alter table app_settings enable row level security;
-- Service Role umgeht RLS — keine Policy für anon/authenticated nötig.
revoke all on app_settings from anon, authenticated;

-- Seed: AI-Limits pro Tier und Stripe Grace-Period
insert into app_settings (key, value, description) values
  ('ai_limit_free',           '1',  'Max. AI-Calls pro Tag für Free-Nutzer'),
  ('ai_limit_pro',            '10', 'Max. AI-Calls pro Tag für Pro-Nutzer'),
  ('ai_limit_enterprise',     '50', 'Max. AI-Calls pro Tag für Enterprise-Nutzer'),
  ('stripe_grace_period_days','7',  'Tage bis Downgrade nach fehlgeschlagener Zahlung (past_due)')
on conflict (key) do nothing;
