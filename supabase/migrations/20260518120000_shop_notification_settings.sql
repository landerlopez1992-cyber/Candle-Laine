-- Notificaciones por email al equipo admin (singleton id = 'default').
-- Debe coincidir con beshop/src/utils/adminAccess.ts

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

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.shop_notification_settings (
  id text primary key default 'default' check (id = 'default'),
  recipient_emails text[] not null default '{}',
  notify_new_orders boolean not null default true,
  notify_new_users boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.shop_notification_settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists shop_notification_settings_updated_at on public.shop_notification_settings;
create trigger shop_notification_settings_updated_at
  before update on public.shop_notification_settings
  for each row execute function public.set_orders_updated_at();

alter table public.shop_notification_settings enable row level security;

create policy "shop_notification_settings_admin_select"
  on public.shop_notification_settings for select to authenticated
  using (public.is_admin());

create policy "shop_notification_settings_admin_insert"
  on public.shop_notification_settings for insert to authenticated
  with check (public.is_admin());

create policy "shop_notification_settings_admin_update"
  on public.shop_notification_settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_notification_settings is 'Singleton admin-only: emails y toggles de alertas (pedidos nuevos, usuarios nuevos).';
