-- Allow authenticated workspace users to upload and view Content Registry media.
-- Object paths are scoped as: {org_id}/{content_registry_id}/{timestamp}.{ext}

insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists content_media_select_by_org_path on storage.objects;
drop policy if exists content_media_insert_by_org_path on storage.objects;
drop policy if exists content_media_update_by_org_path on storage.objects;
drop policy if exists content_media_delete_by_org_path on storage.objects;

create policy content_media_select_by_org_path
on storage.objects
for select
to authenticated
using (
  bucket_id = 'content-media'
  and (storage.foldername(name))[1] = coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
);

create policy content_media_insert_by_org_path
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'content-media'
  and (storage.foldername(name))[1] = coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
);

create policy content_media_update_by_org_path
on storage.objects
for update
to authenticated
using (
  bucket_id = 'content-media'
  and (storage.foldername(name))[1] = coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
)
with check (
  bucket_id = 'content-media'
  and (storage.foldername(name))[1] = coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
);

create policy content_media_delete_by_org_path
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'content-media'
  and (storage.foldername(name))[1] = coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  )
);
