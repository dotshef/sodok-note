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
-- facility_category: 'home' | 'business' | 'mandatory' (lib/constants/facility-category.ts)
-- facility_type: 의무소독시설일 때만 값 존재 (lib/constants/facility-types.ts)
create table clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text,
  name text not null,
  facility_category text not null check (facility_category in ('home','business','mandatory')),
  facility_type text,
  area numeric,
  area_pyeong numeric,
  volume numeric,
  address text,
  contact_name text,
  contact_phone text,
  contact_position text,
  contact_email text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, code)
);

-- 4. visits (실제 방문 기록)
-- client_* 컬럼은 방문 생성 시점의 고객 정보 박제값 (immutable).
-- clients 테이블 수정과 무관하며, 검색·증명서 발급은 모두 박제값 기준.
create table visits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  tenant_id uuid not null references tenants(id) on delete cascade,
  scheduled_date date not null,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed')),
  method text,
  disinfectants_used jsonb,
  notes text,
  visit_code text,
  client_name text not null,
  client_address text,
  client_facility_category text not null check (client_facility_category in ('home','business','mandatory')),
  client_facility_type text,
  client_area numeric,
  client_area_pyeong numeric,
  client_volume numeric,
  client_contact_name text,
  client_contact_position text,
  created_at timestamptz not null,
  unique (tenant_id, visit_code)
);

-- 5. disinfectants (최근 사용 약품)
create table disinfectants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null,
  unique (tenant_id, name)
);

-- 6. disinfection_methods (최근 사용 소독 방법)
create table disinfection_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null,
  unique (tenant_id, name)
);

-- 8. push_subscriptions (웹 푸시 구독)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- 9. email_verification (이메일 인증번호 - 비번찾기/가입)
-- purpose: 'password_reset' | 'signup'
-- 인증번호 만료 후에는 무효. verified_at 기록 후 reset_token 발급 (짧은 일회용 토큰)
create table email_verification (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  purpose text not null check (purpose in ('password_reset', 'signup')),
  expires_at timestamptz not null,
  verified_at timestamptz,
  reset_token text,
  reset_token_expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- 7. certificates (소독증명서)
create table certificates (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null unique references visits(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  certificate_number text not null unique,
  issue_number text,
  hwpx_file_url text,
  hwpx_file_name text,
  pdf_file_url text,
  pdf_file_name text,
  sent_at timestamptz,
  sent_to text,
  created_at timestamptz not null
);

