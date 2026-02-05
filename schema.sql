-- Supabase schema for About Destiny TravelCRM (normalizado)
-- Recomendado: correr este ficheiro no SQL Editor do Supabase.
-- ATENÇÃO: este script APAGA as tabelas abaixo (reset total).

-- Reset total (apaga tudo e recria do zero)
drop table if exists support_case_messages cascade;
drop table if exists opportunity_support_cases cascade;
drop table if exists opportunity_checklist cascade;
drop table if exists opportunity_itinerary cascade;
drop table if exists opportunity_payment_plan cascade;
drop table if exists opportunity_history cascade;
drop table if exists opportunity_comments cascade;
drop table if exists opportunity_tasks cascade;
drop table if exists proposal_components cascade;
drop table if exists proposal_options cascade;
drop table if exists opportunity_attachments cascade;
drop table if exists opportunity_supplier_bookings cascade;
drop table if exists opportunity_ai_drafts cascade;
drop table if exists opportunities cascade;

drop table if exists supplier_incidents cascade;
drop table if exists supplier_usage cascade;
drop table if exists suppliers cascade;

drop table if exists client_documents cascade;
drop table if exists client_travel_companions cascade;
drop table if exists client_family_members cascade;
drop table if exists clients cascade;

drop table if exists campaigns cascade;
drop table if exists employees cascade;
drop table if exists pipelines cascade;

drop function if exists set_updated_at cascade;

create extension if not exists "pgcrypto";

-- Atualização automática do updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========
-- Employees
-- =========
create table if not exists employees (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('Administrador','Gestor de Equipa','Consultor de Viagens','Apoio ao Cliente')),
  status text default 'Ativo',
  avatar_seed text,
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_employees_updated_at
before update on employees
for each row execute function set_updated_at();

-- =========
-- Clients
-- =========
create table if not exists clients (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  short_name text,
  email text unique not null,
  phone text,
  birth_date date,
  passport_expiry date,
  preferred_channel text,
  preferred_language text,
  location text,
  nationality text,

  -- Estruturas flexíveis (JSONB)
  document jsonb,
  corporate jsonb,
  preferences jsonb,
  health jsonb,
  emergency jsonb,
  loyalty jsonb,
  operations jsonb,

  comm_channels text[] default '{}',
  tags text[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_clients_updated_at
before update on clients
for each row execute function set_updated_at();

create table if not exists client_family_members (
  id text primary key default gen_random_uuid()::text,
  client_id text references clients(id) on delete cascade,
  name text not null,
  relationship text,
  age integer,
  birth_date date,
  document_type text,
  document_number text,
  preferences text,
  created_at timestamptz default now()
);

create table if not exists client_travel_companions (
  id text primary key default gen_random_uuid()::text,
  client_id text references clients(id) on delete cascade,
  name text not null,
  relationship text,
  birth_date date,
  document_type text,
  document_number text,
  preferences text,
  created_at timestamptz default now()
);

create table if not exists client_documents (
  id text primary key default gen_random_uuid()::text,
  client_id text references clients(id) on delete cascade,
  name text not null,
  mime_type text,
  size text,
  bucket text,
  path text,
  url text,
  uploaded_at timestamptz default now()
);

-- =========
-- Campaigns (Pacotes de Ofertas)
-- =========
create table if not exists campaigns (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  package_type text check (package_type in ('Campanha','Fechado')),
  travel_type text,
  destination text,
  days integer,
  hotel text,
  flight text,
  transfer text,
  start_at date,
  end_at date,
  target_sales integer,
  target_revenue numeric,
  owner text,
  status text default 'Ativa',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_campaigns_updated_at
before update on campaigns
for each row execute function set_updated_at();

-- =========
-- Opportunities
-- =========
create table if not exists opportunities (
  id text primary key default gen_random_uuid()::text,
  client_id text references clients(id) on delete set null,
  campaign_id text references campaigns(id) on delete set null,
  pipeline_id text,
  stage text,
  status text,
  limit_value numeric default 0,
  estimated_margin numeric default 0,
  adults integer default 1,
  children integer default 0,
  owner text,
  followers text[] default '{}',
  tags text[] default '{}',
  title text not null,
  created_at timestamptz default now(),
  last_interaction_at timestamptz,
  return_date date,
  departure_date date,
  quote_expiry date,
  temperature integer default 50,
  preferred_channel text,
  lost_reason text,
  trip_reason text,
  trip_type text,
  destination text,
  proposal_status text,
  proposal_finalized_at timestamptz,
  proposal_sent_at timestamptz,
  briefing_notes text,
  updated_at timestamptz default now()
);

create trigger trg_opportunities_updated_at
before update on opportunities
for each row execute function set_updated_at();

create table if not exists proposal_options (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  label text,
  title text not null,
  total_price numeric not null,
  description text,
  inclusions text[],
  justification text,
  quality_score integer,
  is_accepted boolean default false,
  version integer default 1
);

create table if not exists proposal_components (
  id text primary key default gen_random_uuid()::text,
  proposal_id text references proposal_options(id) on delete cascade,
  type text,
  provider text,
  description text,
  cost numeric,
  margin numeric,
  is_policy_compliant boolean
);

create table if not exists opportunity_tasks (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  is_completed boolean default false,
  type text
);

create table if not exists opportunity_comments (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  author text,
  role text,
  text text not null,
  timestamp timestamptz default now()
);

create table if not exists opportunity_history (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  user_name text,
  action text,
  timestamp timestamptz default now()
);

create table if not exists opportunity_payment_plan (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  label text,
  amount numeric,
  due_date date,
  status text,
  paid_amount numeric,
  proof_url text,
  paid_at timestamptz
);

create table if not exists opportunity_itinerary (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  type text,
  title text,
  date_time timestamptz,
  location text,
  description text,
  voucher_url text,
  confirmation_code text
);

create table if not exists opportunity_checklist (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  label text,
  is_completed boolean default false,
  is_required boolean default false
);

create table if not exists opportunity_support_cases (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  title text,
  severity text,
  status text,
  created_at timestamptz default now(),
  last_update timestamptz default now()
);

create table if not exists support_case_messages (
  id text primary key default gen_random_uuid()::text,
  support_case_id text references opportunity_support_cases(id) on delete cascade,
  author text,
  role text,
  text text,
  timestamp timestamptz default now()
);

create table if not exists opportunity_attachments (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  name text not null,
  mime_type text,
  size text,
  bucket text,
  path text,
  url text,
  uploaded_at timestamptz default now()
);

create table if not exists opportunity_supplier_bookings (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  supplier_id text,
  supplier_name text,
  service_type text,
  service_description text,
  contracted_amount numeric,
  source text,
  invoice_attachment_id text,
  created_at timestamptz default now()
);

create table if not exists opportunity_ai_drafts (
  id text primary key default gen_random_uuid()::text,
  opportunity_id text references opportunities(id) on delete cascade,
  type text,
  title text,
  content text,
  created_at timestamptz default now(),
  created_by text
);

-- =========
-- Suppliers
-- =========
create table if not exists suppliers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text check (category in ('Hotel','Operadora','Guia','Transfer')),
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_notes text,
  cancellation_policy text,
  payment_terms text,
  cut_off text,
  internal_rating integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_suppliers_updated_at
before update on suppliers
for each row execute function set_updated_at();

create table if not exists supplier_incidents (
  id text primary key default gen_random_uuid()::text,
  supplier_id text references suppliers(id) on delete cascade,
  date timestamptz,
  severity text,
  description text
);

create table if not exists supplier_usage (
  id text primary key default gen_random_uuid()::text,
  supplier_id text references suppliers(id) on delete cascade,
  date timestamptz,
  opportunity_title text,
  note text
);

-- =========
-- Pipelines (opcional)
-- =========
create table if not exists pipelines (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  stages jsonb,
  created_at timestamptz default now()
);

-- =========
-- Índices úteis
-- =========
create index if not exists idx_clients_email on clients(email);
create index if not exists idx_opportunities_client_id on opportunities(client_id);
create index if not exists idx_opportunities_campaign_id on opportunities(campaign_id);
create index if not exists idx_suppliers_category on suppliers(category);

-- =========
-- Storage (opcional) - buckets públicos
-- =========
-- insert into storage.buckets (id, name, public)
-- values ('photos','photos', true), ('propostas','propostas', true), ('documentos','documentos', true)
-- on conflict (id) do nothing;

-- Nota: RLS pode ser configurado no Supabase conforme a política da agência.
