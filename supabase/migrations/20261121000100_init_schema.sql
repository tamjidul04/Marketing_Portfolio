-- =====================================================================
--  Marketing Portfolio — core schema
--  Every section of the public website is driven by these tables and
--  is editable from the admin panel. Security (RLS) is in the next
--  migration; this file only defines structure.
-- =====================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive emails / slugs

-- ---------------------------------------------------------------------
--  Shared helpers
-- ---------------------------------------------------------------------

-- keep updated_at fresh on every UPDATE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- reusable validation domains
create domain public.hex_color as text
  check (value ~ '^#[0-9A-Fa-f]{6}$');

create domain public.slug as citext
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(value) between 1 and 120);

create domain public.http_url as text
  check (value ~* '^https?://' and length(value) <= 2048);

create type public.publish_status  as enum ('draft', 'published');
create type public.message_status  as enum ('new', 'read', 'replied', 'archived', 'spam');
create type public.case_visual     as enum ('bars', 'line', 'ranking', 'ad', 'image');

-- ---------------------------------------------------------------------
--  1. SINGLETONS  (exactly one row each, id = 1)
-- ---------------------------------------------------------------------

-- Who the portfolio belongs to + hero + about text
create table public.profile (
  id                smallint primary key default 1 check (id = 1),
  full_name         text not null default 'Your Name'              check (length(full_name) between 1 and 80),
  short_name        text not null default 'You'                    check (length(short_name) between 1 and 40),   -- "Hi, I'm …"
  initials          text not null default 'YN'                     check (length(initials) between 1 and 3),     -- logo mark
  role_title        text not null default 'Digital Marketing Specialist' check (length(role_title) <= 80),
  -- hero
  headline          text not null default 'Turning Data Into Growth' check (length(headline) <= 80),
  headline_accent   text          default 'Growth'                 check (length(headline_accent) <= 40),        -- word shown in gold
  hero_tags         text[] not null default array['Ads','Analytics','Strategy'] check (cardinality(hero_tags) <= 6),
  hero_intro        text not null default ''                       check (length(hero_intro) <= 400),
  photo_path        text,                                          -- path in storage bucket "media"
  photo_alt         text          default ''                       check (length(photo_alt) <= 160),
  is_available      boolean not null default true,
  availability_text text not null default 'Available for new clients' check (length(availability_text) <= 60),
  trust_text        text          default 'Trusted by growing brands' check (length(trust_text) <= 80),
  -- about
  about_title       text not null default 'About me'               check (length(about_title) <= 120),
  about_body        text not null default ''                       check (length(about_body) <= 4000),       -- markdown
  about_quote       text          default ''                       check (length(about_quote) <= 300),
  location          text          default ''                       check (length(location) <= 120),
  updated_at        timestamptz not null default now()
);

-- Contact details, SEO, tracking, theme, form options
create table public.site_settings (
  id                 smallint primary key default 1 check (id = 1),
  -- contact
  contact_email      citext        check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text          check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  whatsapp           text          check (whatsapp is null or whatsapp ~ '^[0-9]{6,15}$'),  -- digits only, intl format, for wa.me links
  response_time_text text not null default 'I reply within 24 hours' check (length(response_time_text) <= 80),
  -- social links: [{ "platform": "facebook", "url": "https://…" }]
  socials            jsonb not null default '[]'::jsonb check (jsonb_typeof(socials) = 'array'),
  -- consultation form dropdown
  budget_options     text[] not null default array['Under $500','$500 – $1,500','$1,500 – $5,000','$5,000+'],
  -- SEO / sharing
  seo_title          text          check (length(seo_title) <= 70),
  seo_description    text          check (length(seo_description) <= 170),
  og_image_path      text,
  -- tracking (IDs only — scripts are rendered by the website)
  meta_pixel_id      text          check (meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{8,20}$'),
  ga4_id             text          check (ga4_id is null or ga4_id ~ '^G-[A-Z0-9]{4,15}$'),
  -- theme (re-brand the template without code)
  color_primary      public.hex_color not null default '#1B2A4A',
  color_accent       public.hex_color not null default '#E0A526',
  -- section toggles
  show_results       boolean not null default true,
  show_brands        boolean not null default true,
  show_process       boolean not null default true,
  show_tools         boolean not null default true,
  show_faq           boolean not null default true,
  footer_text        text          default '' check (length(footer_text) <= 200),
  updated_at         timestamptz not null default now(),
  constraint socials_shape check (
    jsonb_path_exists(socials, '$[*] ? (!exists(@.platform) || !exists(@.url))') = false
  )
);

-- ---------------------------------------------------------------------
--  2. ORDERED LISTS  (common columns: sort_order, is_visible, timestamps)
-- ---------------------------------------------------------------------

-- Big numbers ("৳50L+ ad spend managed"). show_in_hero → floating hero cards
create table public.stats (
  id           uuid primary key default gen_random_uuid(),
  label        text not null check (length(label) between 1 and 60),
  value        numeric(14,2) not null check (value >= 0),
  prefix       text not null default '' check (length(prefix) <= 4),
  suffix       text not null default '' check (length(suffix) <= 6),
  decimals     smallint not null default 0 check (decimals between 0 and 2),
  show_in_hero boolean not null default false,
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Client / brand logos (marquee)
create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  logo_path   text,                                   -- null → name shown as text
  website_url public.http_url,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Certification badges (Meta Blueprint, Google Ads …)
create table public.certifications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  issuer      text check (length(issuer) <= 80),
  badge_color public.hex_color not null default '#1B2A4A',
  badge_text  text not null default '' check (length(badge_text) <= 2),   -- e.g. "M", "G"
  image_path  text,
  verify_url  public.http_url,
  issued_on   date,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Services (cards + consultation form "service" dropdown)
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(title) between 1 and 80),
  description text not null default '' check (length(description) <= 400),
  icon        text not null default 'target' check (icon ~ '^[a-z0-9-]{1,40}$'),  -- key from the website's icon set
  features    text[] not null default '{}' check (cardinality(features) <= 8),
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- "How I work" steps
create table public.process_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(title) between 1 and 60),
  description text not null default '' check (length(description) <= 240),
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Platforms & tools chips
create table public.tools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 60),
  color       public.hex_color not null default '#1B2A4A',
  icon_path   text,
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- About-section fact rows (Specialization, Education, Based in …)
create table public.about_facts (
  id          uuid primary key default gen_random_uuid(),
  label       text not null check (length(label) between 1 and 40),
  value       text not null check (length(value) between 1 and 160),
  icon        text not null default 'info' check (icon ~ '^[a-z0-9-]{1,40}$'),
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null check (length(question) between 1 and 200),
  answer      text not null check (length(answer) between 1 and 2000),   -- markdown
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  3. CASE STUDIES  (card on home page + its own page /work/[slug])
-- ---------------------------------------------------------------------
create table public.case_studies (
  id              uuid primary key default gen_random_uuid(),
  slug            public.slug not null unique,
  status          public.publish_status not null default 'draft',
  is_featured     boolean not null default true,                         -- shown on home page
  -- card
  title           text not null check (length(title) between 1 and 120),
  client_name     text check (length(client_name) <= 80),                -- may be anonymised ("Fashion brand")
  industry        text check (length(industry) <= 60),
  channels        text[] not null default '{}' check (cardinality(channels) <= 6),  -- tags: Meta Ads, SEO …
  card_color      public.hex_color not null default '#1B2A4A',
  kpi_value       text check (length(kpi_value) <= 16),                  -- "+240%"
  kpi_label       text check (length(kpi_label) <= 60),                  -- "revenue in 90 days"
  summary         text not null default '' check (length(summary) <= 300),
  -- mini visual inside the card
  visual_type     public.case_visual not null default 'bars',
  visual_data     jsonb not null default '{}'::jsonb check (jsonb_typeof(visual_data) = 'object'),
  -- metrics row: [{ "label": "ROAS", "value": "4.1x" }]  (max 4)
  metrics         jsonb not null default '[]'::jsonb
                  check (jsonb_typeof(metrics) = 'array' and jsonb_array_length(metrics) <= 4),
  -- full page (markdown)
  challenge       text not null default '' check (length(challenge) <= 6000),
  strategy        text not null default '' check (length(strategy)  <= 8000),
  results         text not null default '' check (length(results)   <= 6000),
  cover_path      text,
  duration_text   text check (length(duration_text) <= 40),              -- "90 days"
  -- SEO
  seo_title       text check (length(seo_title) <= 70),
  seo_description text check (length(seo_description) <= 170),
  sort_order      integer not null default 0,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint published_has_date check (status = 'draft' or published_at is not null)
);

-- Screenshot gallery for a case study page
create table public.case_study_images (
  id            uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  image_path    text not null,
  caption       text check (length(caption) <= 200),
  alt           text not null default '' check (length(alt) <= 200),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  4. TESTIMONIALS  (optionally linked to a case study)
-- ---------------------------------------------------------------------
create table public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  quote         text not null check (length(quote) between 1 and 800),
  author_name   text not null check (length(author_name) between 1 and 80),
  author_role   text check (length(author_role) <= 80),
  company       text check (length(company) <= 80),
  avatar_path   text,
  avatar_color  public.hex_color not null default '#2F6F62',             -- initials bubble if no photo
  rating        smallint check (rating between 1 and 5),
  case_study_id uuid references public.case_studies(id) on delete set null,
  sort_order    integer not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  5. INBOX — consultation form submissions
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(btrim(name)) between 1 and 100),
  business     text check (length(business) <= 120),
  phone        text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  email        citext check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  service      text check (length(service) <= 80),
  budget       text check (length(budget) <= 60),
  message      text not null default '' check (length(message) <= 5000),
  status       public.message_status not null default 'new',
  admin_note   text check (length(admin_note) <= 2000),
  source_path  text check (length(source_path) <= 300),                  -- page the form was sent from
  ip_hash      text check (length(ip_hash) <= 128),                      -- hashed, for rate-limiting only (never raw IP)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint reachable check (phone is not null or email is not null)
);

-- ---------------------------------------------------------------------
--  6. ADMINS  — which auth users may edit (no public sign-up)
-- ---------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Indexes (lists are tiny; index what the website filters/sorts on)
-- ---------------------------------------------------------------------
create index stats_order_idx            on public.stats            (sort_order) where is_visible;
create index brands_order_idx           on public.brands           (sort_order) where is_visible;
create index certifications_order_idx   on public.certifications   (sort_order) where is_visible;
create index services_order_idx         on public.services         (sort_order) where is_visible;
create index process_steps_order_idx    on public.process_steps    (sort_order) where is_visible;
create index tools_order_idx            on public.tools            (sort_order) where is_visible;
create index about_facts_order_idx      on public.about_facts      (sort_order) where is_visible;
create index faqs_order_idx             on public.faqs             (sort_order) where is_visible;
create index testimonials_order_idx     on public.testimonials     (sort_order) where is_visible;
create index case_studies_public_idx    on public.case_studies     (sort_order) where status = 'published';
create index case_study_images_case_idx on public.case_study_images(case_study_id, sort_order);
create index testimonials_case_idx      on public.testimonials     (case_study_id);
create index contact_messages_inbox_idx on public.contact_messages (status, created_at desc);
create index contact_messages_rate_idx  on public.contact_messages (ip_hash, created_at desc);

-- ---------------------------------------------------------------------
--  updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profile','site_settings','stats','brands','certifications','services',
    'process_steps','tools','about_facts','faqs','case_studies','testimonials','contact_messages'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- auto-set published_at the first time a case study is published
create or replace function public.case_studies_publish_date()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger case_studies_publish_date
  before insert or update of status on public.case_studies
  for each row execute function public.case_studies_publish_date();

-- singleton rows always exist
insert into public.profile (id) values (1) on conflict do nothing;
insert into public.site_settings (id) values (1) on conflict do nothing;
