-- Sección «Nuestra historia» en el home: título, texto y galería (rutas en shop-media).

create table if not exists public.shop_home_story (
  id text primary key check (id = 'default'),
  title text not null default 'Nuestra historia',
  body_text text not null default '',
  image_paths text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.shop_home_story (id, title, body_text, image_paths)
values ('default', 'Nuestra historia', '', '{}')
on conflict (id) do nothing;

drop trigger if exists shop_home_story_updated_at on public.shop_home_story;
create trigger shop_home_story_updated_at
  before update on public.shop_home_story
  for each row execute function public.set_orders_updated_at();

alter table public.shop_home_story enable row level security;

drop policy if exists "shop_home_story_select_public" on public.shop_home_story;
create policy "shop_home_story_select_public"
  on public.shop_home_story for select
  using (true);

drop policy if exists "shop_home_story_admin_all" on public.shop_home_story;
create policy "shop_home_story_admin_all"
  on public.shop_home_story for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_home_story is
  'Bloque home «Nuestra historia»: título, texto largo, image_paths[] en bucket shop-media.';
