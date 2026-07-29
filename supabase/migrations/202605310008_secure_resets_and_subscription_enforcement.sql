-- Secure password reset links and subscription lifecycle reminders.

alter table public.student_password_recovery_requests
  add column if not exists user_id text,
  add column if not exists reset_token_hash text,
  add column if not exists used_at timestamptz;

create index if not exists student_password_recovery_token_idx
on public.student_password_recovery_requests (reset_token_hash, status, expires_at);

alter table public.user_profiles
  add column if not exists subscription_renewal_reminder_sent_at timestamptz,
  add column if not exists subscription_expired_email_sent_at timestamptz;
