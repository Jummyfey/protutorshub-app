-- Track live learning-session heartbeats so abandoned sessions can be detected server-side.

alter table public.study_sessions
  add column if not exists last_active_at timestamptz not null default now(),
  add column if not exists abandoned_at timestamptz,
  add column if not exists abandoned_alert_sent boolean not null default false;

create index if not exists study_sessions_abandonment_idx
on public.study_sessions (status, last_active_at, abandoned_alert_sent);
