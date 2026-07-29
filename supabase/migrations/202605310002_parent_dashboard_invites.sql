-- Parent dashboard invite links and parent-controlled timetable.

alter table public.parent_child_links
  add column if not exists invite_token text unique,
  add column if not exists invite_created_at timestamptz not null default now();

create table if not exists public.parent_timetables (
  invite_token text primary key references public.parent_child_links(invite_token) on delete cascade,
  child_id text not null,
  parent_id text,
  timetable jsonb not null default '[]'::jsonb,
  reminder_minutes integer not null default 10,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists parent_timetables_set_updated_at on public.parent_timetables;
create trigger parent_timetables_set_updated_at
before update on public.parent_timetables
for each row execute function public.set_updated_at();

alter table public.parent_timetables enable row level security;

create policy "review parent timetables access"
on public.parent_timetables for all
to anon, authenticated
using (true)
with check (true);
