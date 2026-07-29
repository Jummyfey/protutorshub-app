-- Allow parents to lock the timetable so students can view it but not edit it.

alter table public.parent_timetables
  add column if not exists locked boolean not null default false;
