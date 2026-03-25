-- Cupones configurables desde admin: % en producto, % en pedido, envío gratis; caducidad opcional.

create table if not exists public.shop_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  coupon_type text not null check (coupon_type in (
    'percent_product',
    'percent_order',
    'free_shipping'
  )),
  discount_percent int,
  product_id uuid references public.shop_products (id) on delete set null,
  display_name text not null default 'Candle Laine',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  max_uses int,
  uses_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_coupons_code_unique unique (code),
  constraint shop_coupons_type_fields check (
    (coupon_type = 'free_shipping'
      and discount_percent is null
      and product_id is null)
    or
    (coupon_type = 'percent_order'
      and discount_percent is not null
      and discount_percent >= 1
      and discount_percent <= 100
      and product_id is null)
    or
    (coupon_type = 'percent_product'
      and discount_percent is not null
      and discount_percent >= 1
      and discount_percent <= 100
      and product_id is not null)
  )
);

create index if not exists shop_coupons_active_dates_idx
  on public.shop_coupons (is_active, ends_at);

drop trigger if exists shop_coupons_updated_at on public.shop_coupons;
create trigger shop_coupons_updated_at
  before update on public.shop_coupons
  for each row execute function public.set_orders_updated_at();

alter table public.shop_coupons enable row level security;

drop policy if exists "shop_coupons_select_valid_public" on public.shop_coupons;
create policy "shop_coupons_select_valid_public"
  on public.shop_coupons for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

drop policy if exists "shop_coupons_admin_all" on public.shop_coupons;
create policy "shop_coupons_admin_all"
  on public.shop_coupons for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_coupons is
  'Cupones de tienda: tipo, código único, opcional producto y fechas.';
