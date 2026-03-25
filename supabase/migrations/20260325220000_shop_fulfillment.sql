-- Origin warehouse for shipping quotes (USPS-style fallback in Edge Function).
create table if not exists public.shop_fulfillment (
  id text primary key default 'default',
  ship_from_zip text not null default '33470',
  ship_from_state text not null default 'FL',
  ship_from_country text not null default 'US',
  updated_at timestamptz not null default now()
);

insert into public.shop_fulfillment (id, ship_from_zip, ship_from_state, ship_from_country)
  values ('default', '33470', 'FL', 'US')
on conflict (id) do nothing;

alter table public.shop_fulfillment enable row level security;

drop policy if exists "shop_fulfillment_select_authenticated" on public.shop_fulfillment;
create policy "shop_fulfillment_select_authenticated"
  on public.shop_fulfillment for select to authenticated
  using (true);

comment on table public.shop_fulfillment is
  'Single-row origin for domestic shipping rate estimates (fallback when EasyPost is not configured).';
