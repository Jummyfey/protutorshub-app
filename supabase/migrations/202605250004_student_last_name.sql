alter table public.student_profiles
  add column if not exists student_last_name text;

update public.student_profiles
set student_last_name = ''
where student_last_name is null;
