-- Parent monitoring and child activity tracking.
-- Keeps one child activity stream that can power alerts, reports, and an optional dashboard.

create table if not exists public.parent_child_links (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  parent_id text not null,
  child_name text,
  parent_name text,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (child_id, parent_id)
);

create table if not exists public.parent_notification_preferences (
  child_id text primary key,
  parent_id text,
  parent_email text,
  parent_whatsapp_number text,
  enable_email_alerts boolean not null default false,
  enable_whatsapp_alerts boolean not null default false,
  enable_parent_dashboard boolean not null default false,
  alert_on_app_opened boolean not null default true,
  alert_on_session_started boolean not null default true,
  alert_on_session_completed boolean not null default true,
  alert_on_missed_session boolean not null default true,
  receive_daily_report boolean not null default false,
  receive_weekly_report boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.child_activity_events
  add column if not exists child_id text,
  add column if not exists parent_id text,
  add column if not exists topics jsonb not null default '[]'::jsonb,
  add column if not exists event_timestamp timestamptz,
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists score numeric;

update public.child_activity_events
set child_id = coalesce(child_id, app_user_id),
    event_timestamp = coalesce(event_timestamp, occurred_at, created_at)
where child_id is null or event_timestamp is null;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  child_id text not null,
  parent_id text,
  status text not null default 'started',
  topics jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 0,
  score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_alert_notifications (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  parent_id text,
  event_id text,
  channel text not null check (channel in ('email', 'whatsapp', 'dashboard')),
  recipient text,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

drop trigger if exists parent_notification_preferences_set_updated_at on public.parent_notification_preferences;
create trigger parent_notification_preferences_set_updated_at
before update on public.parent_notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists study_sessions_set_updated_at on public.study_sessions;
create trigger study_sessions_set_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

alter table public.parent_child_links enable row level security;
alter table public.parent_notification_preferences enable row level security;
alter table public.study_sessions enable row level security;
alter table public.parent_alert_notifications enable row level security;

create policy "review parent child links access"
on public.parent_child_links for all
to anon, authenticated
using (true)
with check (true);

create policy "review parent notification preferences access"
on public.parent_notification_preferences for all
to anon, authenticated
using (true)
with check (true);

create policy "review study sessions access"
on public.study_sessions for all
to anon, authenticated
using (true)
with check (true);

create policy "review parent alert notifications access"
on public.parent_alert_notifications for all
to anon, authenticated
using (true)
with check (true);
