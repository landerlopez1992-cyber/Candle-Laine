-- Stripe modo tienda única (sin Connect OAuth):
-- Guardamos publishable keys por modo para frontend checkout.

alter table public.shop_stripe_runtime
  add column if not exists publishable_key_test text not null default '',
  add column if not exists publishable_key_live text not null default '';

comment on column public.shop_stripe_runtime.publishable_key_test
  is 'Publishable key Stripe TEST (pk_test_...)';
comment on column public.shop_stripe_runtime.publishable_key_live
  is 'Publishable key Stripe LIVE (pk_live_...)';
