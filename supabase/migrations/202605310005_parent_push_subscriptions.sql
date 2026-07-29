-- Store parent device push subscriptions for installed parent dashboards.

create table if not exists public.parent_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  parent_id text,
  invite_token text references public.parent_child_links(invite_token) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists parent_push_subscriptions_set_updated_at on public.parent_push_subscriptions;
create trigger parent_push_subscriptions_set_updated_at
before update on public.parent_push_subscriptions
for each row execute function public.set_updated_at();

create index if not exists parent_push_subscriptions_child_idx
on public.parent_push_subscriptions (child_id, enabled);

alter table public.parent_push_subscriptions enable row level security;

create policy "review parent push subscriptions access"
on public.parent_push_subscriptions for all
to anon, authenticated
using (true)
with check (true);
