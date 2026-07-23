-- Compliance-Migrationsplan Phase 3, Schritt 1/3 (#249): compliance_source_drafts
-- um Fakten-Abgleich-Felder erweitern. Bisher speichert die Tabelle nur quellen-
-- basierte Change-Drafts (status_estimate final/entwurf/unklar) für die 4 Scanner-
-- Quellen. Der Scheduled Deep-Check (#250) prüft einzelne Checklistenpunkte gegen
-- ihre Primärquelle und legt seine Ergebnisse ebenfalls hier ab — unterscheidbar
-- über checklist_item_id (NULL = alter Change-Draft, gesetzt = Fakten-Abgleich).
-- status_estimate-Werte (mit Daniel abgestimmt): bestaetigt / korrektur_vorgeschlagen.

alter table public.compliance_source_drafts
  add column if not exists checklist_item_id uuid references public.compliance_checklist_items(id) on delete cascade,
  add column if not exists suggested_value    text;

-- CHECK um die Fakten-Abgleich-Werte erweitern.
alter table public.compliance_source_drafts
  drop constraint if exists compliance_source_drafts_estimate_check;
alter table public.compliance_source_drafts
  add constraint compliance_source_drafts_estimate_check
  check (status_estimate in ('final', 'entwurf', 'unklar', 'bestaetigt', 'korrektur_vorgeschlagen'));

create index if not exists idx_compliance_drafts_item
  on public.compliance_source_drafts (checklist_item_id) where checklist_item_id is not null;
