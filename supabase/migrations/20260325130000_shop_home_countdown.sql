-- Cuenta regresiva promocional en el home (producto + fecha fin + textos), configurable desde admin.

create table if not exists public.shop_home_countdown (
  id text primary key check (id = 'default'),
  enabled boolean not null default false,
  product_id uuid references public.shop_products (id) on delete set null,
  ends_at timestamptz,
  body_text text not null default '',
  button_label text not null default 'Buy now',
  updated_at timestamptz not null default now()
);

insert into public.shop_home_countdown (id, enabled, body_text, button_label)
values ('default', false, '', 'Buy now')
on conflict (id) do nothing;

drop trigger if exists shop_home_countdown_updated_at on public.shop_home_countdown;
create trigger shop_home_countdown_updated_at
  before update on public.shop_home_countdown
  for each row execute function public.set_orders_updated_at();

alter table public.shop_home_countdown enable row level security;

drop policy if exists "shop_home_countdown_select_public" on public.shop_home_countdown;
create policy "shop_home_countdown_select_public"
  on public.shop_home_countdown for select
  using (true);

drop policy if exists "shop_home_countdown_admin_all" on public.shop_home_countdown;
create policy "shop_home_countdown_admin_all"
  on public.shop_home_countdown for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_home_countdown is
  'Promo home: cuenta regresiva hasta ends_at, producto enlazado, textos y etiqueta del botón.';
