-- ============================================
-- ReportEasy — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  language text default 'English',
  free_used boolean default false,
  credits_remaining integer default 0,
  plan text default 'free', -- free | single | bundle | monthly | annual
  plan_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── REPORTS ───────────────────────────────
create table reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  file_name text,
  language text default 'English',
  summary text,
  parameters jsonb default '[]',
  doctor_questions jsonb default '[]',
  urgency text default 'routine', -- routine | soon | urgent
  urgency_note text,
  raw_result jsonb,
  created_at timestamptz default now()
);

-- Index for fast user report lookup
create index reports_user_id_idx on reports(user_id);
create index reports_created_at_idx on reports(created_at desc);

-- ─── TRANSACTIONS ──────────────────────────
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  plan text not null,
  amount_usd numeric(8,2),
  amount_inr numeric(10,2),
  currency text default 'USD',
  provider text, -- lemon_squeezy | razorpay
  provider_order_id text,
  status text default 'pending', -- pending | paid | failed
  credits_added integer default 0,
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ─────────────────────
alter table profiles enable row level security;
alter table reports enable row level security;
alter table transactions enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- Reports: users can only see/create their own
create policy "Users read own reports" on reports
  for select using (auth.uid() = user_id);
create policy "Users insert own reports" on reports
  for insert with check (auth.uid() = user_id);

-- Transactions: users can only see their own
create policy "Users read own transactions" on transactions
  for select using (auth.uid() = user_id);

-- ─── STORAGE BUCKET ────────────────────────
-- Run this in Supabase Storage settings or SQL:
-- insert into storage.buckets (id, name, public) values ('reports', 'reports', false);

-- Storage policy: users can only access their own folder
-- create policy "Users can upload their reports"
--   on storage.objects for insert
--   with check (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can read their reports"
--   on storage.objects for select
--   using (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);
