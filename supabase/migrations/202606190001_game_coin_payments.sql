-- Verified game coin purchases and backend wallet balance.

create table if not exists public.game_wallets (
  app_user_id text primary key references public.user_profiles(app_user_id) on delete cascade,
  coin_balance integer not null default 0 check (coin_balance >= 0),
  rewarded_ads_watched integer not null default 0 check (rewarded_ads_watched >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_coin_purchases (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null references public.user_profiles(app_user_id) on delete cascade,
  pack_id text not null check (pack_id in ('starter', 'value', 'family')),
  coins integer not null check (coins > 0),
  amount numeric not null,
  currency text not null default 'NGN',
  tx_ref text not null unique,
  flutterwave_transaction_id text not null unique,
  flutterwave_status text not null,
  provider_response jsonb not null default '{}'::jsonb,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists game_wallets_set_updated_at on public.game_wallets;
create trigger game_wallets_set_updated_at
before update on public.game_wallets
for each row execute function public.set_updated_at();

alter table public.game_wallets enable row level security;
alter table public.game_coin_purchases enable row level security;

create policy "review game wallets access"
on public.game_wallets for all
to anon, authenticated
using (true)
with check (true);

create policy "review game coin purchases access"
on public.game_coin_purchases for all
to anon, authenticated
using (true)
with check (true);
