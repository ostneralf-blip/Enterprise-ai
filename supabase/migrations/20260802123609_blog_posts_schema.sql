-- Blog-Inhalte aus src/config/blog-data.ts in die Datenbank, damit sie im Admin-Panel
-- angelegt, geprüft, freigegeben und deaktiviert werden können (Anforderung Daniel,
-- 02.08.2026). Hintergrund ist Art. 50 Abs. 4 EU AI Act: Für KI-unterstützt erstellte
-- Texte, die die Öffentlichkeit informieren, entfällt die Kennzeichnungspflicht nur bei
-- echter menschlicher Prüfung mit benannter redaktioneller Verantwortung. Die Freigabe
-- muss also nachweisbar sein — dafür braucht es einen Status und einen Freigabevermerk
-- statt einer Konstante im Code.
--
-- Aufbau bewusst analog compliance_regulations (#245): Admin-CRUD über
-- requireAdmin + Admin-Client, DE/EN parallel, Veröffentlichungs-Flag, set_updated_at.
-- UNTERSCHIED zu #245: Dort ist ALLES locale-per-row. Hier sind Status, Freigabe und
-- Datumsangaben bewusst NICHT pro Sprache, sondern am Beitrag — ein Beitrag ist als
-- Ganzes freigegeben oder nicht. Sonst könnte DE veröffentlicht und EN im Entwurf sein,
-- und der Freigabevermerk wäre uneindeutig.
--
-- Bewusste Entscheidung Daniel (02.08.2026): KEIN separates Änderungsprotokoll. Der
-- Freigabevermerk (reviewed_by/reviewed_at) liegt am Beitrag und wird von einer späteren
-- Änderung überschrieben — eine lückenlose Historie entsteht dadurch nicht. Falls später
-- ein echter Audit-Trail gebraucht wird, ist eine Protokolltabelle additiv nachrüstbar,
-- ohne dieses Schema zu ändern.

-- ─── Beitrag (sprachunabhängig) ─────────────────────────────────────────────
create table if not exists public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  status              text not null default 'draft'
                        check (status in ('draft','in_review','published','archived')),
  published_at        date,
  content_updated_at  date,
  reading_minutes     int  not null default 5 check (reading_minutes between 1 and 120),
  -- Kennzeichnung nach Art. 50 Abs. 4: Wurde der Text KI-unterstützt entworfen?
  ai_assisted         boolean not null default false,
  -- Redaktionelle Verantwortung: Name der Person, die den Text geprüft und freigegeben hat.
  reviewed_by         text,
  reviewed_at         timestamptz,
  cta_tool_slug       text,
  related_guide_slugs text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Kern der Nachweisführung: Ein Beitrag kann NICHT veröffentlicht sein, ohne dass
  -- Prüfer und Prüfdatum gesetzt sind. Absichtlich auf DB-Ebene und nicht nur in der
  -- API — so lässt sich die Freigabe auch bei einem Fehler im Anwendungscode nicht
  -- umgehen, und die Ausnahme des Art. 50 Abs. 4 bleibt belegbar.
  constraint blog_posts_published_requires_review check (
    status <> 'published'
    or (reviewed_by is not null and reviewed_at is not null and published_at is not null)
  )
);

-- ─── Übersetzungen (je Sprache eine Zeile) ──────────────────────────────────
create table if not exists public.blog_post_translations (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references public.blog_posts(id) on delete cascade,
  locale           text not null check (locale in ('de','en')),
  category         text not null,
  eyebrow          text not null,
  title            text not null,
  meta_description text not null,
  lead             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (post_id, locale)
);

-- ─── Abschnitte (je Sprache eine Zeile, über position sortiert) ─────────────
create table if not exists public.blog_post_sections (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.blog_posts(id) on delete cascade,
  locale       text not null check (locale in ('de','en')),
  position     int  not null,
  heading      text not null,
  paragraphs   text[] not null default '{}',
  bullets      text[] not null default '{}',
  callout_tag  text,
  callout_body text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (post_id, locale, position)
);

create index if not exists idx_blog_posts_public
  on public.blog_posts (status, published_at desc);
create index if not exists idx_blog_post_translations_lookup
  on public.blog_post_translations (post_id, locale);
create index if not exists idx_blog_post_sections_lookup
  on public.blog_post_sections (post_id, locale, position);

-- ─── updated_at-Trigger (bestehende Helper-Funktion) ────────────────────────
drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

drop trigger if exists blog_post_translations_updated_at on public.blog_post_translations;
create trigger blog_post_translations_updated_at
  before update on public.blog_post_translations
  for each row execute function public.set_updated_at();

drop trigger if exists blog_post_sections_updated_at on public.blog_post_sections;
create trigger blog_post_sections_updated_at
  before update on public.blog_post_sections
  for each row execute function public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- WICHTIG, Unterschied zu compliance_regulations: Der Blog ist öffentlich. Dort reicht
-- „authenticated_read", hier müssen auch ANONYME Besucher und Suchmaschinen lesen
-- dürfen — aber ausschließlich veröffentlichte Beiträge. Entwürfe und Beiträge in
-- Prüfung dürfen nie nach außen gelangen.
alter table public.blog_posts             enable row level security;
alter table public.blog_post_translations enable row level security;
alter table public.blog_post_sections     enable row level security;

drop policy if exists "public_read_published" on public.blog_posts;
create policy "public_read_published" on public.blog_posts
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "admin_all" on public.blog_posts;
create policy "admin_all" on public.blog_posts
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "public_read_published" on public.blog_post_translations;
create policy "public_read_published" on public.blog_post_translations
  for select to anon, authenticated
  using (exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_translations.post_id and p.status = 'published'
  ));

drop policy if exists "admin_all" on public.blog_post_translations;
create policy "admin_all" on public.blog_post_translations
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "public_read_published" on public.blog_post_sections;
create policy "public_read_published" on public.blog_post_sections
  for select to anon, authenticated
  using (exists (
    select 1 from public.blog_posts p
    where p.id = blog_post_sections.post_id and p.status = 'published'
  ));

drop policy if exists "admin_all" on public.blog_post_sections;
create policy "admin_all" on public.blog_post_sections
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
