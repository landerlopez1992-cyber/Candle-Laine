-- Bucket for user-uploaded profile photos: path `<user_uuid>/<filename>`.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "user_avatars_public_read" on storage.objects;
drop policy if exists "user_avatars_own_insert" on storage.objects;
drop policy if exists "user_avatars_own_update" on storage.objects;
drop policy if exists "user_avatars_own_delete" on storage.objects;

create policy "user_avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

create policy "user_avatars_own_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_avatars_own_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_avatars_own_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
