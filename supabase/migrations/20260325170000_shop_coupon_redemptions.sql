-- Un cupón por usuario: una sola redención; al usarse en un pedido queda registrado y desaparece de «Current».

create table if not exists public.shop_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  coupon_id uuid not null references public.shop_coupons (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  used_at timestamptz not null default now(),
  unique (user_id, coupon_id)
);

create index if not exists shop_coupon_redemptions_user_used_idx
  on public.shop_coupon_redemptions (user_id, used_at desc);

drop trigger if exists shop_coupon_redemptions_updated_at on public.shop_coupon_redemptions;

alter table public.shop_coupon_redemptions enable row level security;

drop policy if exists "shop_coupon_redemptions_select_own" on public.shop_coupon_redemptions;
create policy "shop_coupon_redemptions_select_own"
  on public.shop_coupon_redemptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "shop_coupon_redemptions_insert_own" on public.shop_coupon_redemptions;
create policy "shop_coupon_redemptions_insert_own"
  on public.shop_coupon_redemptions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "shop_coupon_redemptions_admin_all" on public.shop_coupon_redemptions;
create policy "shop_coupon_redemptions_admin_all"
  on public.shop_coupon_redemptions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_coupon_redemptions is
  'Cupón canjeado una sola vez por usuario; asociado opcionalmente al pedido.';

-- Poder leer la ficha del cupón en «Used» aunque ya haya caducado a nivel global.
drop policy if exists "shop_coupons_select_redeemed_own" on public.shop_coupons;
create policy "shop_coupons_select_redeemed_own"
  on public.shop_coupons for select to authenticated
  using (
    exists (
      select 1 from public.shop_coupon_redemptions r
      where r.coupon_id = shop_coupons.id
        and r.user_id = auth.uid()
    )
  );
