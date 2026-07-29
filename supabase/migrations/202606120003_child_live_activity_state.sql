create table if not exists public.child_live_activity_state (
  child_id text primary key,
  parent_id text,
  child_name text,
  current_event_type text,
  current_page text,
  current_topic text,
  current_lesson text,
  topics jsonb not null default '[]'::jsonb,
  duration_seconds integer not null default 0,
  score numeric,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.child_live_activity_state enable row level security;

drop policy if exists "review child live activity state access" on public.child_live_activity_state;
create policy "review child live activity state access"
on public.child_live_activity_state for all
to anon, authenticated
using (true)
with check (true);

drop trigger if exists child_live_activity_state_set_updated_at on public.child_live_activity_state;
create trigger child_live_activity_state_set_updated_at
before update on public.child_live_activity_state
for each row execute function public.set_updated_at();
