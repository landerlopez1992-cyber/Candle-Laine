-- Direcciones de envío por usuario (selector país → estado → municipio + calle y zip en app).

create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default '',
  country_iso2 text not null,
  state_code text not null default '',
  municipality text not null default '',
  street text not null default '',
  zip text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_addresses_user_id_idx on public.user_addresses (user_id);

alter table public.user_addresses enable row level security;

drop policy if exists "user_addresses_own_select" on public.user_addresses;
drop policy if exists "user_addresses_own_insert" on public.user_addresses;
drop policy if exists "user_addresses_own_update" on public.user_addresses;
drop policy if exists "user_addresses_own_delete" on public.user_addresses;

create policy "user_addresses_own_select"
  on public.user_addresses for select to authenticated
  using (auth.uid() = user_id);

create policy "user_addresses_own_insert"
  on public.user_addresses for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_addresses_own_update"
  on public.user_addresses for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_addresses_own_delete"
  on public.user_addresses for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.user_addresses is 'Shipping addresses; country_iso2 = ISO 3166-1 alpha-2; state_code from country-state-city.';
