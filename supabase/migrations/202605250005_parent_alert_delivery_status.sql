-- Delivery status details for parent alert sending providers.

alter table public.parent_alert_notifications
  add column if not exists provider_response jsonb not null default '{}'::jsonb;
