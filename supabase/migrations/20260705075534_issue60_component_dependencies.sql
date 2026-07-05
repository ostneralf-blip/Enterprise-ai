-- Issue #60: Komponentenabhängigkeiten für dynamisches Architekturdiagramm
alter table component_catalog
  add column if not exists incompatible_with text[] not null default '{}',
  add column if not exists requires          text[] not null default '{}',
  add column if not exists suggests          text[] not null default '{}';

comment on column component_catalog.incompatible_with is 'Namen von Komponenten, die nicht kombiniert werden sollten (bidirektional)';
comment on column component_catalog.requires          is 'Namen von Komponenten, die zwingend benötigt werden (unidirektional)';
comment on column component_catalog.suggests          is 'Namen von Komponenten, die als Ergänzung empfohlen werden (unidirektional)';
