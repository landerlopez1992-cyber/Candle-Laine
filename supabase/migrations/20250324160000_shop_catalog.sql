-- Catálogo: categorías, subcategorías, productos + bucket Storage shop-media
-- Requiere public.is_admin() (migración profiles_orders_admin)

create table if not exists public.shop_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.shop_categories (id) on delete cascade,
  name text not null,
  cover_storage_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shop_subcategories_category_idx
  on public.shop_subcategories (category_id);

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.shop_categories (id) on delete cascade,
  subcategory_id uuid references public.shop_subcategories (id) on delete set null,
  name text not null,
  details text,
  image_paths text[] not null default '{}',
  flag_discount boolean not null default false,
  flag_offer boolean not null default false,
  flag_hot boolean not null default false,
  flag_new boolean not null default false,
  weight_grams int,
  stock_quantity int not null default 0,
  price_cents int not null default 0,
  compare_at_price_cents int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Si shop_products ya existía de una versión antigua (solo subcategory_id), añade category_id
-- antes de crear índices; si no, CREATE INDEX ... (category_id) falla con 42703.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'shop_products'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'shop_products' and column_name = 'category_id'
  ) then
    alter table public.shop_products
      add column category_id uuid references public.shop_categories (id) on delete cascade;
    update public.shop_products p
    set category_id = s.category_id
    from public.shop_subcategories s
    where p.subcategory_id is not null and p.subcategory_id = s.id;
    alter table public.shop_products alter column subcategory_id drop not null;
    alter table public.shop_products alter column category_id set not null;
  end if;
end $$;

create index if not exists shop_products_category_idx
  on public.shop_products (category_id);

create index if not exists shop_products_subcat_idx
  on public.shop_products (subcategory_id);

create or replace function public.shop_products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shop_products_updated_at on public.shop_products;
create trigger shop_products_updated_at
  before update on public.shop_products
  for each row execute function public.shop_products_set_updated_at();

alter table public.shop_categories enable row level security;
alter table public.shop_subcategories enable row level security;
alter table public.shop_products enable row level security;

-- Re-ejecutable en el dashboard: CREATE POLICY no tiene IF NOT EXISTS
drop policy if exists "shop_categories_select_public" on public.shop_categories;
drop policy if exists "shop_categories_admin_all" on public.shop_categories;
drop policy if exists "shop_subcategories_select_public" on public.shop_subcategories;
drop policy if exists "shop_subcategories_admin_all" on public.shop_subcategories;
drop policy if exists "shop_products_select_public" on public.shop_products;
drop policy if exists "shop_products_admin_all" on public.shop_products;

create policy "shop_categories_select_public"
  on public.shop_categories for select using (true);

create policy "shop_categories_admin_all"
  on public.shop_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "shop_subcategories_select_public"
  on public.shop_subcategories for select using (true);

create policy "shop_subcategories_admin_all"
  on public.shop_subcategories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "shop_products_select_public"
  on public.shop_products for select using (true);

create policy "shop_products_admin_all"
  on public.shop_products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Bucket imágenes (público lectura; escritura solo admin vía políticas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_media_public_read" on storage.objects;
drop policy if exists "shop_media_admin_insert" on storage.objects;
drop policy if exists "shop_media_admin_update" on storage.objects;
drop policy if exists "shop_media_admin_delete" on storage.objects;

create policy "shop_media_public_read"
  on storage.objects for select
  using (bucket_id = 'shop-media');

create policy "shop_media_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-media' and public.is_admin());

create policy "shop_media_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'shop-media' and public.is_admin())
  with check (bucket_id = 'shop-media' and public.is_admin());

create policy "shop_media_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'shop-media' and public.is_admin());

comment on table public.shop_categories is 'Categorías de tienda; portada en Storage (shop-media).';
comment on table public.shop_subcategories is 'Subcategorías por categoría.';
comment on table public.shop_products is 'Productos; precios en centavos; etiquetas booleanas.';
