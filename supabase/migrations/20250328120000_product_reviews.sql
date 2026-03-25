-- Reseñas por producto (Supabase); media agregada en vista para listados.

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_reviews_user_product_unique unique (user_id, product_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id);

create index if not exists product_reviews_user_idx
  on public.product_reviews (user_id);

drop trigger if exists product_reviews_updated_at on public.product_reviews;
create trigger product_reviews_updated_at
  before update on public.product_reviews
  for each row execute function public.set_orders_updated_at();

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_select_public" on public.product_reviews;
create policy "product_reviews_select_public"
  on public.product_reviews for select
  using (true);

drop policy if exists "product_reviews_insert_own" on public.product_reviews;
create policy "product_reviews_insert_own"
  on public.product_reviews for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "product_reviews_update_own" on public.product_reviews;
create policy "product_reviews_update_own"
  on public.product_reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "product_reviews_delete_own" on public.product_reviews;
create policy "product_reviews_delete_own"
  on public.product_reviews for delete to authenticated
  using (auth.uid() = user_id);

create or replace view public.shop_product_rating_stats as
select
  product_id,
  round(avg(rating::numeric), 2)::numeric as avg_rating,
  count(*)::int as review_count
from public.product_reviews
group by product_id;

comment on table public.product_reviews is
  'Reseñas por producto; un usuario solo puede tener una reseña por producto (upsert).';
comment on view public.shop_product_rating_stats is
  'Media y conteo de reseñas por product_id (para tarjetas y fichas).';
