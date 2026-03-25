-- Avatar URL + optional contact fields for the storefront profile screens.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists location text;

comment on column public.profiles.avatar_url is 'Public URL (Storage) for the user profile photo.';
comment on column public.profiles.phone is 'Optional phone shown on Edit profile.';
comment on column public.profiles.location is 'Optional location line shown on Edit profile.';
