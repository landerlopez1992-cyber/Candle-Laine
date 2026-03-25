-- Perfiles (espejo de auth.users) + pedidos con estados para el panel admin.
-- El email de admin debe coincidir con beshop/src/utils/adminAccess.ts

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'landerlopez1992@gmail.com';
$$;

grant execute on function public.is_admin() to authenticated;

-- Perfiles: un fila por usuario; rellenado por trigger + backfill
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios ya existentes antes de esta migración
insert into public.profiles (id, email, full_name, created_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  created_at
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

-- Pedidos
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'created',
      'processing',
      'shipped'
    );
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null default 'created',
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

create policy "orders_admin_all"
  on public.orders for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.profiles is 'Perfil público por usuario; sincronizado desde auth.users.';
comment on table public.orders is 'Pedidos; estados: created → processing → shipped.';
comment on column public.orders.status is 'created=orden creada, processing=procesándose, shipped=enviada';
