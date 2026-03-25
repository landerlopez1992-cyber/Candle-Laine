-- Stripe runtime config (singleton, solo admin).
-- Permite alternar TEST/LIVE desde Admin sin tocar código.

create table if not exists public.shop_stripe_runtime (
  id text primary key default 'default' check (id = 'default'),
  use_test_mode boolean not null default true,
  connect_client_id_test text not null default '',
  connect_client_id_live text not null default '',
  secret_key_test text not null default '',
  secret_key_live text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.shop_stripe_runtime (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists shop_stripe_runtime_updated_at on public.shop_stripe_runtime;
create trigger shop_stripe_runtime_updated_at
  before update on public.shop_stripe_runtime
  for each row execute function public.set_orders_updated_at();

alter table public.shop_stripe_runtime enable row level security;

create policy "shop_stripe_runtime_admin_select"
  on public.shop_stripe_runtime for select to authenticated
  using (public.is_admin());

create policy "shop_stripe_runtime_admin_insert"
  on public.shop_stripe_runtime for insert to authenticated
  with check (public.is_admin());

create policy "shop_stripe_runtime_admin_update"
  on public.shop_stripe_runtime for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.shop_stripe_runtime is 'Singleton admin-only: Stripe Connect TEST/LIVE client IDs, secret keys y modo activo.';
