-- price_config: DB-gesteuerte Preisanzeige (Stripe wird manuell synchron gehalten)
create table public.price_config (
  tier                   text          primary key,
  monthly_price          numeric(10,2) not null,
  yearly_price           numeric(10,2),
  currency               text          not null default 'EUR',
  stripe_price_id        text,
  stripe_price_id_yearly text,
  updated_at             timestamptz   not null default now()
);

insert into public.price_config (tier, monthly_price, yearly_price, currency)
values ('pro', 49.00, 399.00, 'EUR');

alter table public.price_config enable row level security;

create policy "Jeder kann Preise lesen"
  on public.price_config for select using (true);

-- promotions: Admin schaltet Aktionen ein/aus (Banner + Aktionspreis im UpgradeModal)
create table public.promotions (
  id                     uuid          primary key default gen_random_uuid(),
  name                   text          not null,
  badge_text             text          not null,
  description            text,
  promo_price            numeric(10,2) not null,
  promo_price_yearly     numeric(10,2),
  valid_from             timestamptz,
  valid_until            timestamptz,
  stripe_price_id        text,
  stripe_price_id_yearly text,
  is_active              boolean       not null default false,
  created_at             timestamptz   not null default now(),
  updated_at             timestamptz   not null default now()
);

alter table public.promotions enable row level security;

create policy "Jeder kann Aktionen lesen"
  on public.promotions for select using (true);
