-- Student account setup and parent-assisted recovery.
-- Plain-text passwords are never stored.

create table if not exists public.student_profiles (
  id text primary key,
  user_id text not null,
  student_first_name text not null,
  age integer not null,
  username text not null unique,
  parent_email text not null,
  parent_whatsapp_number text,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_password_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  parent_email text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  status text not null default 'pending_parent_verification',
  message text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

drop trigger if exists student_profiles_set_updated_at on public.student_profiles;
create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row execute function public.set_updated_at();

alter table public.student_profiles enable row level security;
alter table public.student_password_recovery_requests enable row level security;

create policy "review student profiles access"
on public.student_profiles for all
to anon, authenticated
using (true)
with check (true);

create policy "review student recovery access"
on public.student_password_recovery_requests for all
to anon, authenticated
using (true)
with check (true);
