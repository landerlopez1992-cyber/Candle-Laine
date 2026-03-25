-- Banners del home (Banner 1 y Banner 2): carrusel configurable desde el panel admin.

create table if not exists public.shop_home_banners (
  id text primary key check (id in ('banner_1', 'banner_2')),
  slide_interval_ms int not null default 5000 check (slide_interval_ms >= 1000 and slide_interval_ms <= 120000),
  slides jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.shop_home_banners (id, slide_interval_ms, slides)
values
  ('banner_1', 5000, '[]'::jsonb),
  ('banner_2', 5000, '[]'::jsonb)
on conflict (id) do nothing;

drop trigger if exists shop_home_banners_updated_at on public.shop_home_banners;
create trigger shop_home_banners_updated_at
  before update on public.shop_home_banners
  for each row execute function public.set_orders_updated_at();

alter table public.shop_home_banners enable row level security;

create policy "shop_home_banners_select_public"
  on public.shop_home_banners for select
  using (true);

create policy "shop_home_banners_admin_insert"
  on public.shop_home_banners for insert to authenticated
  with check (public.is_admin());

create policy "shop_home_banners_admin_update"
  on public.shop_home_banners for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_home_banners is 'Banner 1/2 del home: slides JSON [{image_path, title, subtitle, button_label, link_path}] y intervalo autoplay.';
comment on column public.shop_home_banners.slides is 'Array JSON: image_path en bucket shop-media; textos y link opcionales.';
