-- Store resized child profile photos for the parent portal.

alter table public.parent_child_links
  add column if not exists child_avatar_url text;

alter table public.user_profiles
  add column if not exists avatar_url text;

alter table public.student_profiles
  add column if not exists profile_photo_url text;
