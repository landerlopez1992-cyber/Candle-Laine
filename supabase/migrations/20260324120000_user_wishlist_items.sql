-- Favoritos por usuario (misma idea que user_cart_items, sin cantidad).

create table if not exists public.user_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.shop_products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists user_wishlist_items_user_idx
  on public.user_wishlist_items (user_id);

alter table public.user_wishlist_items enable row level security;

drop policy if exists "user_wishlist_select_own" on public.user_wishlist_items;
create policy "user_wishlist_select_own"
  on public.user_wishlist_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_wishlist_insert_own" on public.user_wishlist_items;
create policy "user_wishlist_insert_own"
  on public.user_wishlist_items for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_wishlist_delete_own" on public.user_wishlist_items;
create policy "user_wishlist_delete_own"
  on public.user_wishlist_items for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_wishlist_admin_all" on public.user_wishlist_items;
create policy "user_wishlist_admin_all"
  on public.user_wishlist_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.user_wishlist_items is 'Wishlist / me gusta persistido por usuario (shop_products).';
