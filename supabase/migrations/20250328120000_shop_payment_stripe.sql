-- Stripe Connect: cuenta vinculada (OAuth) para cobros con la plataforma.
alter table public.shop_payment_settings
  add column if not exists stripe_enabled boolean not null default false;

alter table public.shop_payment_settings
  add column if not exists stripe_connect_account_id text not null default '';

alter table public.shop_payment_settings
  add column if not exists stripe_livemode boolean not null default false;

comment on column public.shop_payment_settings.stripe_enabled is 'Si la tienda puede cobrar con Stripe (cuenta Connect vinculada).';
comment on column public.shop_payment_settings.stripe_connect_account_id is 'ID cuenta Stripe Connect (acct_...) tras OAuth.';
comment on column public.shop_payment_settings.stripe_livemode is 'true si el token OAuth fue en modo live.';
