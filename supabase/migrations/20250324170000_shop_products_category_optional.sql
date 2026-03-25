-- Productos: pueden colgarse solo de categoría o de subcategoría (subcategoría opcional).
-- category_id obligatorio; subcategory_id opcional.

alter table public.shop_products
  add column if not exists category_id uuid references public.shop_categories (id) on delete cascade;

update public.shop_products p
set category_id = s.category_id
from public.shop_subcategories s
where p.subcategory_id is not null
  and p.subcategory_id = s.id
  and (p.category_id is distinct from s.category_id or p.category_id is null);

alter table public.shop_products
  alter column subcategory_id drop not null;

-- Tras el backfill, todo producto existente tiene category_id vía su subcategoría
alter table public.shop_products
  alter column category_id set not null;

comment on column public.shop_products.category_id is 'Categoría obligatoria; el producto puede ir solo aquí sin subcategoría.';
comment on column public.shop_products.subcategory_id is 'Opcional; si es null, el producto está solo bajo la categoría.';
