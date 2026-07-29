create table if not exists public.user_profiles (
  app_user_id text primary key,
  package_type text not null default 'free' check (package_type in ('free', 'standard', 'elite')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  app_user_id text primary key references public.user_profiles(app_user_id) on delete cascade,
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_schedules (
  app_user_id text primary key references public.user_profiles(app_user_id) on delete cascade,
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id bigserial primary key,
  app_user_id text not null references public.user_profiles(app_user_id) on delete cascade,
  attempt_id text not null,
  test_type text not null,
  package_type text not null default 'free',
  percentage numeric not null default 0,
  completed_at timestamptz not null default now(),
  attempt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_user_id, attempt_id)
);

create table if not exists public.child_activity_events (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null references public.user_profiles(app_user_id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.parent_reports (
  id uuid primary key default gen_random_uuid(),
  app_user_id text not null references public.user_profiles(app_user_id) on delete cascade,
  report_week date not null,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (app_user_id, report_week)
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists study_plans_set_updated_at on public.study_plans;
create trigger study_plans_set_updated_at
before update on public.study_plans
for each row execute function public.set_updated_at();

drop trigger if exists parent_schedules_set_updated_at on public.parent_schedules;
create trigger parent_schedules_set_updated_at
before update on public.parent_schedules
for each row execute function public.set_updated_at();

drop trigger if exists attempts_set_updated_at on public.attempts;
create trigger attempts_set_updated_at
before update on public.attempts
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.study_plans enable row level security;
alter table public.parent_schedules enable row level security;
alter table public.attempts enable row level security;
alter table public.child_activity_events enable row level security;
alter table public.parent_reports enable row level security;

-- Temporary review policies.
-- They allow the current frontend-only app to sync with Supabase before auth is added.
-- Replace these with auth.uid()-based policies before accepting real student data.
create policy "review user profiles access"
on public.user_profiles for all
to anon, authenticated
using (true)
with check (true);

create policy "review study plans access"
on public.study_plans for all
to anon, authenticated
using (true)
with check (true);

create policy "review parent schedules access"
on public.parent_schedules for all
to anon, authenticated
using (true)
with check (true);

create policy "review attempts access"
on public.attempts for all
to anon, authenticated
using (true)
with check (true);

create policy "review child activity access"
on public.child_activity_events for all
to anon, authenticated
using (true)
with check (true);

create policy "review parent reports access"
on public.parent_reports for all
to anon, authenticated
using (true)
with check (true);
