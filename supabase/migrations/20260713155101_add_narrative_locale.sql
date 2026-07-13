-- #172: narrative_locale auf architectures — speichert die Sprache des KI-Narrativs
alter table architectures
  add column if not exists narrative_locale text check (narrative_locale in ('de', 'en'));
