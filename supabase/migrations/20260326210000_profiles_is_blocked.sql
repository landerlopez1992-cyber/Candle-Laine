-- Cuenta bloqueada por admin: el cliente no puede alterar el flag; solo admins.

alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

comment on column public.profiles.is_blocked is 'Si true, la app cierra sesión y muestra contacto de la empresa.';

create or replace function public.profiles_lock_is_blocked_for_non_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_blocked := old.is_blocked;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_is_blocked on public.profiles;
create trigger profiles_lock_is_blocked
  before update on public.profiles
  for each row execute function public.profiles_lock_is_blocked_for_non_admin();

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_addresses_admin_select" on public.user_addresses;
create policy "user_addresses_admin_select"
  on public.user_addresses for select to authenticated
  using (public.is_admin());
