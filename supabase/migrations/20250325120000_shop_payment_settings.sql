-- Configuración de métodos de pago (Zelle) para tienda y panel admin.
-- Una sola fila singleton (id = 'default').

create table if not exists public.shop_payment_settings (
  id text primary key default 'default' check (id = 'default'),
  zelle_enabled boolean not null default false,
  zelle_phone text not null default '',
  zelle_instructions text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.shop_payment_settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists shop_payment_settings_updated_at on public.shop_payment_settings;
create trigger shop_payment_settings_updated_at
  before update on public.shop_payment_settings
  for each row execute function public.set_orders_updated_at();

alter table public.shop_payment_settings enable row level security;

-- Lectura pública (anon + auth) para mostrar instrucciones en checkout.
create policy "shop_payment_settings_select_public"
  on public.shop_payment_settings for select
  using (true);

-- Solo administradores pueden insertar/actualizar.
create policy "shop_payment_settings_admin_insert"
  on public.shop_payment_settings for insert to authenticated
  with check (public.is_admin());

create policy "shop_payment_settings_admin_update"
  on public.shop_payment_settings for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_payment_settings is 'Singleton: teléfono/instrucciones Zelle y activación para checkout.';
