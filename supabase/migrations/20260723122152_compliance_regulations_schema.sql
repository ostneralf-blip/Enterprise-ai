-- Compliance-Content-Migration Schritt 1/5 (#243): DB-Schema für Compliance-Regularien.
-- Ziel: Compliance-Inhalte aus der statischen src/config/compliance-data.ts in die DB,
-- admin-editierbar + faktengeprüft, analog content_library (locale-per-row).
--
-- Design-Entscheidungen (faithfully completing den #243-Vorschlag):
--  * locale-per-row für BEIDE Tabellen → parallele DE/EN-Datensätze. UNIQUE(slug, locale)
--    statt „slug UNIQUE" (nötig bei locale-per-row).
--  * Ein Checklistenpunkt referenziert die Regulierungs-Zeile DERSELBEN Sprache
--    (regulation_id FK). So bleibt der UUID-FK aus dem Issue erhalten und Queries
--    filtern konsistent nach einer Locale.
--  * NEU ggü. Issue-Vorschlag: `risk_class` auf compliance_checklist_items — EU-AI-Act-
--    Pflichten sind je Risikoklasse gruppiert (Record<RiskClass, Item[]>); ohne diese
--    Spalte ginge die Klassen-Zuordnung verloren. NULL für alle Nicht-EU-AI-Act-Punkte.
--  * item_key entspricht der bisherigen ChecklistItem.id — WICHTIG: diese id wird als
--    `check_type` in compliance_checks gespeichert; damit gespeicherte Nutzer-Checks
--    und das V2-Scoring weiter matchen, MUSS item_key == alte id bleiben.

-- ─── Regulierungen ──────────────────────────────────────────────────────────
create table if not exists public.compliance_regulations (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  locale        text not null default 'de' check (locale in ('de','en')),
  category      text not null check (category in ('gesetz','standard','aufsichtsrecht')),
  short_label   text not null,
  label         text not null,
  description   text,
  applicability text,
  display_order int  not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (slug, locale)
);

-- ─── Checklistenpunkte ──────────────────────────────────────────────────────
create table if not exists public.compliance_checklist_items (
  id            uuid primary key default gen_random_uuid(),
  regulation_id uuid not null references public.compliance_regulations(id) on delete cascade,
  item_key      text not null,
  locale        text not null default 'de' check (locale in ('de','en')),
  risk_class    text check (risk_class in ('prohibited','high','limited','minimal')),
  article       text,
  source_url    text,
  last_verified date,
  label         text not null,
  description   text,
  relevance     text,
  category      text,
  display_order int  not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (regulation_id, item_key)
);

create index if not exists idx_compliance_regulations_lookup
  on public.compliance_regulations (locale, is_published, display_order);
create index if not exists idx_compliance_checklist_items_reg
  on public.compliance_checklist_items (regulation_id, locale, is_published, display_order);

-- ─── updated_at-Trigger (bestehende Helper-Funktion) ────────────────────────
drop trigger if exists compliance_regulations_updated_at on public.compliance_regulations;
create trigger compliance_regulations_updated_at
  before update on public.compliance_regulations
  for each row execute function public.set_updated_at();

drop trigger if exists compliance_checklist_items_updated_at on public.compliance_checklist_items;
create trigger compliance_checklist_items_updated_at
  before update on public.compliance_checklist_items
  for each row execute function public.set_updated_at();

-- ─── RLS (analog content_library) ───────────────────────────────────────────
alter table public.compliance_regulations      enable row level security;
alter table public.compliance_checklist_items  enable row level security;

drop policy if exists "authenticated_read" on public.compliance_regulations;
create policy "authenticated_read" on public.compliance_regulations
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "admin_all" on public.compliance_regulations;
create policy "admin_all" on public.compliance_regulations
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "authenticated_read" on public.compliance_checklist_items;
create policy "authenticated_read" on public.compliance_checklist_items
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "admin_all" on public.compliance_checklist_items;
create policy "admin_all" on public.compliance_checklist_items
  for all
  using (public.is_admin())
  with check (public.is_admin());
