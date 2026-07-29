-- Verified subscription payments and subscription state.

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null references public.user_profiles(app_user_id) on delete cascade,
  package_type text not null check (package_type in ('standard', 'elite')),
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  amount numeric not null,
  currency text not null default 'NGN',
  tx_ref text not null unique,
  flutterwave_transaction_id text not null unique,
  flutterwave_status text not null,
  provider_response jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists subscription_status text not null default 'free',
  add column if not exists subscription_billing_cycle text,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists last_payment_tx_ref text;

alter table public.subscription_payments enable row level security;

create policy "review subscription payments access"
on public.subscription_payments for all
to anon, authenticated
using (true)
with check (true);
