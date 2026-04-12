-- 1. tenants (방역업체)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_number text,
  owner_name text,
  phone text,
  address text,
  plan text not null default 'basic' check (plan in ('basic', 'plus', 'pro')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- 2. users (사용자)
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  name text not null,
  phone text,
  role text not null default 'member' check (role in ('admin', 'member')),
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- 3. clients (고객 시설)
-- facility_type은 서버 상수로 관리 (lib/constants/facility-types.ts)
create table clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text,
  name text not null,
  facility_type text not null,
  area numeric,
  area_pyeong numeric,
  volume numeric,
  address text,
  contact_name text,
  contact_phone text,
  contact_position text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, code)
);

-- 4. visits (실제 방문 기록)
create table visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  tenant_id uuid not null references tenants(id) on delete cascade,
  scheduled_date date not null,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed')),
  method text,
  chemicals_used text[],
  notes text,
  visit_code text,
  created_at timestamptz not null,
  unique (tenant_id, visit_code)
);

-- 5. certificates (소독증명서)
create table certificates (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null unique references visits(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  certificate_number text not null unique,
  issue_number text,
  file_url text,
  sent_at timestamptz,
  sent_to text,
  created_at timestamptz not null
);

