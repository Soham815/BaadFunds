-- ============================================================
-- BaadFunds Supabase Schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- PLANS ----------
-- The investment plans Soham (admin) creates for Baad.
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  interval_type text not null check (interval_type in ('daily','monthly','lumpsum')),
  min_amount numeric not null default 0,          -- minimum per-interval amount
  interest_rate numeric not null default 8,        -- annual % (fixed)
  maturity_months integer not null default 12,      -- lock-in / maturity period
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- INVESTMENTS ----------
-- Baad's active enrollments into a plan.
create table if not exists investments (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references plans(id) on delete set null,
  plan_name_snapshot text,               -- keeps name even if plan edited/deleted
  interval_type text not null,
  interest_rate numeric not null,        -- locked in at enrollment time
  maturity_months integer not null,
  contribution_amount numeric not null,   -- amount per interval (or lumpsum total)
  start_date date not null default current_date,
  maturity_date date not null,
  status text not null default 'active' check (status in ('active','matured','withdrawn','closed')),
  total_invested numeric not null default 0,   -- sum of approved payments
  last_payment_date date,
  created_at timestamptz default now()
);

-- ---------- PAYMENTS ----------
-- Every due/attempted/approved contribution + penalties.
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references investments(id) on delete cascade,
  due_date date not null,
  amount numeric not null,
  method text check (method in ('upi','cash', null)),
  status text not null default 'pending' check (status in ('pending','attempted','approved','rejected')),
  attempted_at timestamptz,
  approved_at timestamptz,
  is_penalty boolean default false,
  penalty_units integer default 0,        -- e.g. 2 burgers
  penalty_item text default 'burgers',
  penalty_paid boolean default false,
  paid_via_loan_id uuid,
  created_at timestamptz default now()
);

-- ---------- WITHDRAWAL REQUESTS ----------
create table if not exists withdrawal_requests (
  id uuid primary key default uuid_generate_v4(),
  investment_id uuid references investments(id) on delete cascade,
  requested_at timestamptz default now(),
  is_before_maturity boolean not null default false,
  charge_units integer default 0,          -- e.g. 2 momos
  charge_item text default 'steamed momos',
  charge_paid boolean default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_at timestamptz
);

-- ---------- LOANS ----------
create table if not exists loans (
  id uuid primary key default uuid_generate_v4(),
  amount numeric not null,
  monthly_interest_rate numeric not null default 50,
  status text not null default 'requested' check (status in ('requested','approved','rejected','paid')),
  requested_at timestamptz default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  auto_paid_investment_id uuid references investments(id),  -- SIP it auto-covered
  notes text default ''
);

-- ---------- COUPONS ----------
-- Scratch-card surprise coupons the admin drops for Baad.
create table if not exists coupons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  image_url text,
  is_active boolean default true,     -- currently waiting to be shown
  is_revealed boolean default false,
  created_at timestamptz default now(),
  revealed_at timestamptz
);

-- ---------- CHAT LOG (optional, for Soham the bot) ----------
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  sender text not null check (sender in ('baad','soham')),
  message text not null,
  created_at timestamptz default now()
);
