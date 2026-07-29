-- Public storage bucket for resized student profile photos uploaded from the parent portal.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'child-profile-photos',
  'child-profile-photos',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read child profile photos" on storage.objects;
create policy "Public read child profile photos"
on storage.objects for select
using (bucket_id = 'child-profile-photos');

drop policy if exists "Anon upload child profile photos" on storage.objects;
create policy "Anon upload child profile photos"
on storage.objects for insert
with check (bucket_id = 'child-profile-photos');

drop policy if exists "Anon update child profile photos" on storage.objects;
create policy "Anon update child profile photos"
on storage.objects for update
using (bucket_id = 'child-profile-photos')
with check (bucket_id = 'child-profile-photos');
