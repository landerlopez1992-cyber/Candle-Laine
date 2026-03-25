-- Líneas de pedido, carrito por usuario, estados extra y políticas de inserción.

do $$ begin
  alter type public.order_status add value 'pending_payment';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.order_status add value 'cancelled';
exception when duplicate_object then null;
end $$;

alter table public.orders add column if not exists human_order_number text;
alter table public.orders add column if not exists payment_method text;

create unique index if not exists orders_human_order_number_uidx
  on public.orders (human_order_number) where human_order_number is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.shop_products (id) on delete set null,
  name text not null,
  image_url text,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.user_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.shop_products (id) on delete cascade,
  quantity int not null check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.order_items enable row level security;
alter table public.user_cart_items enable row level security;

drop policy if exists "order_items_select_via_order" on public.order_items;
create policy "order_items_select_via_order"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_insert_via_order" on public.order_items;
create policy "order_items_insert_via_order"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_cart_select_own" on public.user_cart_items;
create policy "user_cart_select_own"
  on public.user_cart_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_cart_insert_own" on public.user_cart_items;
create policy "user_cart_insert_own"
  on public.user_cart_items for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_cart_update_own" on public.user_cart_items;
create policy "user_cart_update_own"
  on public.user_cart_items for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_cart_delete_own" on public.user_cart_items;
create policy "user_cart_delete_own"
  on public.user_cart_items for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_cart_admin_all" on public.user_cart_items;
create policy "user_cart_admin_all"
  on public.user_cart_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert to authenticated
  with check (auth.uid() = user_id);

comment on table public.order_items is 'Líneas de pedido (snapshot nombre, precio, imagen).';
comment on table public.user_cart_items is 'Carrito persistido por usuario (productos shop_products).';
