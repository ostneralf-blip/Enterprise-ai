-- catalog_suggestions: KI-Komponentenvorschläge ohne Katalog-Treffer.
-- Hintergrund (18.07.2026): die KI schlägt im Architektur-Modul regelmäßig
-- reale, sinnvolle Komponenten vor, die aber (noch) keinen Eintrag im
-- component_catalog haben — sie wurden bisher lautlos verworfen ("No further
-- suggestions"). Statt den Katalog dauerhaft "hinterherzupflegen", werden
-- solche unbekannten Vorschläge jetzt serverseitig protokolliert und können
-- im Admin-Panel mit einem Klick als echter Katalog-Eintrag übernommen werden.
create table if not exists catalog_suggestions (
  id                    uuid primary key default gen_random_uuid(),
  suggested_name        text not null,
  module                text not null default 'architecture', -- 'architecture' | 'canvas' | ...
  section               text,             -- z.B. 'narrative_exec' | 'narrative_architect'
  context               jsonb,            -- z.B. { architecture_id, locale, components }
  occurrence_count      int not null default 1,
  status                text not null default 'pending', -- 'pending' | 'added' | 'dismissed'
  catalog_component_id  uuid references component_catalog(id) on delete set null,
  created_at            timestamptz default now(),
  last_seen_at          timestamptz default now(),
  resolved_at           timestamptz,
  resolved_by           uuid references profiles(id) on delete set null
);

-- Ein offener Vorschlag pro (bereinigtem) Namen — wiederholte KI-Vorschläge
-- erhöhen occurrence_count statt Duplikate anzulegen.
create unique index if not exists catalog_suggestions_pending_name_idx
  on catalog_suggestions (lower(trim(suggested_name)))
  where status = 'pending';

alter table catalog_suggestions enable row level security;

-- Nur Admins dürfen die Liste einsehen/bearbeiten (Review-UI im Admin-Panel).
create policy "catalog_suggestions_admin_all"
  on catalog_suggestions for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Das Protokollieren selbst läuft server-seitig über den Admin-Client
-- (Service Role, umgeht RLS) — reguläre Nutzer haben keinen INSERT-Zugriff.
