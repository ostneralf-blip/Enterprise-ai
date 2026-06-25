-- ── component_catalog ────────────────────────────────────────────────────────
create table if not exists component_catalog (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  vendor            text,
  category          text,            -- 'llm' | 'data_platform' | 'ml_platform' | 'mlops' | 'monitoring' | 'governance' | 'security' | 'integration' | 'serving'
  architecture_layer text,           -- 'data' | 'model' | 'serving' | 'mlops' | 'application' | 'governance' | 'security'
  hosting           text[],          -- ['eu', 'us', 'onprem', 'hybrid']
  dsgvo_status      text,            -- 'compliant' | 'conditional' | 'non_compliant'
  eu_ai_act_risk    text,            -- 'minimal' | 'limited' | 'high' | 'prohibited'
  sap_compatible    boolean default false,
  sap_components    text[],          -- ['btp', 'ai_core', 'datasphere', 'joule', 'genai_hub', 'mdg']
  use_case_types    text[],          -- ['generative', 'predictive', 'vision', 'automation']
  infra_types       text[],          -- ['cloud', 'hybrid', 'onprem']
  cloud_provider    text,            -- 'aws' | 'azure' | 'gcp' | 'sap' | 'independent'
  icon_name         text,            -- iconify icon name, e.g. 'logos:aws'
  website_url       text,
  description       text,
  tags              text[],
  source            text default 'manual', -- 'manual' | 'sap_api' | 'cncf_landscape' | 'huggingface' | 'custom_url'
  source_url        text,
  external_id       text,
  last_synced_at    timestamptz,
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create unique index if not exists component_catalog_name_vendor_idx on component_catalog (name, coalesce(vendor, ''));

-- ── roles_catalog ─────────────────────────────────────────────────────────────
create table if not exists roles_catalog (
  id                      uuid primary key default gen_random_uuid(),
  role_name               text not null unique,
  role_category           text,     -- 'strategic' | 'technical' | 'governance' | 'operational'
  archetype_levels        text[],   -- ['starter', 'scaler', 'transformer']
  description             text,
  responsibilities        text[],
  skills_required         text[],
  reports_to              text[],
  interacts_with          text[],
  fte_range               text,
  priority_per_archetype  jsonb,    -- {starter: 'optional', scaler: 'should', transformer: 'must'}
  is_active               boolean default true,
  created_at              timestamptz default now()
);

-- ── catalog_sources ───────────────────────────────────────────────────────────
create table if not exists catalog_sources (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  type                text,    -- 'sap_api' | 'cncf_landscape' | 'huggingface' | 'rest_json' | 'manual'
  url                 text,
  api_key_encrypted   text,    -- AES-256 encrypted via app secret
  category_filter     text[],
  cloud_provider_tag  text,
  field_mapping       jsonb,
  sync_interval_days  int default 30,
  last_synced_at      timestamptz,
  last_sync_added     int,
  last_sync_updated   int,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- ── extend architectures ──────────────────────────────────────────────────────
alter table architectures
  add column if not exists diagram_data       jsonb,
  add column if not exists org_chart_data     jsonb,
  add column if not exists selected_components uuid[],
  add column if not exists selected_roles     uuid[],
  add column if not exists sap_scenario       boolean default false,
  add column if not exists cloud_providers    text[],
  add column if not exists joule_use_cases    jsonb;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table component_catalog enable row level security;
alter table roles_catalog     enable row level security;
alter table catalog_sources   enable row level security;

-- Authenticated users can read catalog
create policy "catalog_read_authenticated"
  on component_catalog for select
  to authenticated
  using (is_active = true);

create policy "roles_read_authenticated"
  on roles_catalog for select
  to authenticated
  using (is_active = true);

-- Only admins can write catalog (checked via profiles.is_admin)
create policy "catalog_admin_all"
  on component_catalog for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "roles_admin_all"
  on roles_catalog for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- catalog_sources: admin-only
create policy "catalog_sources_admin_all"
  on catalog_sources for all
  to authenticated
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ── seed: default catalog_sources ────────────────────────────────────────────
insert into catalog_sources (name, type, url, sync_interval_days, is_active) values
  ('CNCF Landscape',  'cncf_landscape', 'https://landscape.cncf.io/data/landscape.json', 7,  true),
  ('Hugging Face Hub','huggingface',    'https://huggingface.co/api/models',               14, true),
  ('SAP API Hub',     'sap_api',        'https://api.sap.com',                             30, false)
on conflict (name) do nothing;
