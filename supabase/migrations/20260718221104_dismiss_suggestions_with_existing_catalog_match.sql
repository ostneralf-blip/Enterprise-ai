-- Fix: PostgREST kappt jede Antwort hart bei api.max_rows=1000
-- (supabase/config.toml) — der Katalog liegt inzwischen bei >1450 aktiven
-- Einträgen, die unpaginierte Katalog-Abfrage in der Analyse-Route lieferte
-- also nur einen willkürlichen Ausschnitt. Dadurch galten tatsächlich
-- vorhandene Einträge (u. a. "Databricks", "Kubernetes", "SAP Analytics
-- Cloud" — allesamt EXAKTE Namenstreffer!) als "unbekannt" und wurden
-- wiederholt neu vorgeschlagen (Bug-Report Daniel, 19.07.2026). Route
-- paginiert jetzt vollständig — hier einmalig alle aktuell "pending"
-- Vorschläge verwerfen, für die bereits ein aktiver Katalog-Eintrag
-- (per Name ODER Alias, case-/whitespace-unempfindlich) existiert.
update catalog_suggestions cs
set status = 'dismissed', resolved_at = now()
where cs.status = 'pending'
  and exists (
    select 1 from component_catalog cc
    where cc.is_active = true
      and (
        lower(trim(cc.name)) = lower(trim(cs.suggested_name))
        or exists (
          select 1 from unnest(coalesce(cc.aliases, '{}')) as alias
          where lower(trim(alias)) = lower(trim(cs.suggested_name))
        )
      )
  );
