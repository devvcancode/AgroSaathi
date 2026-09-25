create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  owner_id text,
  name text not null,
  village text default '',
  district text not null,
  state text default '',
  crop_type text not null default 'Rice',
  area_in_acres numeric not null default 1,
  latitude double precision not null,
  longitude double precision not null,
  soil_ph numeric,
  nitrogen_kg_per_ha numeric,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.machinery (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  provider text not null,
  district text not null,
  price_per_acre numeric not null default 0,
  available boolean not null default true,
  lat double precision,
  lon double precision
);

create table if not exists public.district_metrics (
  id uuid primary key default gen_random_uuid(),
  district text not null unique,
  rate numeric not null default 0,
  buyer_demand text not null default 'Medium',
  machinery_readiness numeric not null default 0,
  hotspots numeric not null default 0,
  state text not null default 'India'
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete set null,
  farmer_name text not null,
  machinery_type text not null,
  provider text default '',
  district text default '',
  booking_date date not null default current_date,
  acres numeric not null default 1,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists public.stress_diagnostic_logs (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete set null,
  tmax numeric,
  tmin numeric,
  diurnal_score numeric,
  night_score numeric,
  frost_score numeric,
  drought_index numeric,
  recommended_product text,
  spray_window_start timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id text not null,
  seller_name text,
  seller_state text,
  seller_place text,
  expected_delivery_days integer not null default 7,
  name text not null,
  category text not null,
  listing_type text not null default 'input',
  residue_type text,
  quality_grade text,
  moisture_percent numeric,
  quantity_quintals numeric,
  pickup_district text default '',
  notes text default '',
  price_inr numeric not null check (price_inr > 0),
  stock_units integer not null default 0 check (stock_units >= 0),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  farm_id uuid references public.farms(id) on delete set null,
  buyer_id text,
  seller_id text not null,
  seller_name text,
  seller_state text,
  seller_place text,
  listing_name text,
  expected_delivery_days integer not null default 7,
  expected_delivery_at timestamptz,
  quantity integer not null default 1 check (quantity > 0),
  total_inr numeric not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  review_type text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.buyer_needs (
  id uuid primary key default gen_random_uuid(),
  buyer_id text not null,
  crop_type text not null,
  residue_type text not null,
  use_case text not null default 'Biomass processing',
  quantity numeric not null check (quantity > 0),
  region text not null default 'India',
  urgency text not null default 'This month',
  notes text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.farms add column if not exists owner_id text;
alter table public.marketplace_listings add column if not exists seller_name text;
alter table public.marketplace_listings add column if not exists seller_state text;
alter table public.marketplace_listings add column if not exists seller_place text;
alter table public.marketplace_listings add column if not exists expected_delivery_days integer not null default 7;
alter table public.marketplace_orders add column if not exists buyer_id text;
alter table public.marketplace_orders add column if not exists seller_name text;
alter table public.marketplace_orders add column if not exists seller_state text;
alter table public.marketplace_orders add column if not exists seller_place text;
alter table public.marketplace_orders add column if not exists listing_name text;
alter table public.marketplace_orders add column if not exists expected_delivery_days integer not null default 7;
alter table public.marketplace_orders add column if not exists expected_delivery_at timestamptz;
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  title text not null,
  instructions text default '',
  due_date date not null default current_date,
  status text not null default 'open',
  source text not null default 'recommendation',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  recipient_id text not null,
  text text not null,
  source_language text not null default 'en',
  target_language text not null default 'en',
  translated_text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.earnings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  role text not null,
  source text not null,
  amount_inr numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.dispatch (
  id uuid primary key default gen_random_uuid(),
  driver_id text not null,
  farmer_id text,
  buyer_id text,
  pickup_location jsonb,
  drop_location jsonb,
  status text not null default 'assigned',
  eta_minutes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  type text not null,
  title text not null,
  message text not null,
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.residue_profiles (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms(id) on delete cascade,
  residue_type text not null,
  quality_grade text not null,
  quantity_quintals numeric not null check (quantity_quintals > 0),
  moisture_percent numeric,
  packaging text not null default 'Loose',
  pickup_ready_date date,
  notes text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.residue_operations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  residue_type text not null,
  quantity_quintals numeric not null check (quantity_quintals >= 0),
  quality_grade text not null default 'Standard',
  pickup_ready_date date,
  dispatch_window text default '',
  buyer_signal text default '',
  next_actions jsonb not null default '[]'::jsonb,
  safety_note text default '',
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farms enable row level security;
alter table public.machinery enable row level security;
alter table public.district_metrics enable row level security;
alter table public.bookings enable row level security;
alter table public.stress_diagnostic_logs enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.admin_reviews enable row level security;
alter table public.buyer_needs enable row level security;
alter table public.tasks enable row level security;
alter table public.messages enable row level security;
alter table public.earnings enable row level security;
alter table public.dispatch enable row level security;
alter table public.notifications enable row level security;
alter table public.residue_profiles enable row level security;
alter table public.residue_operations enable row level security;
