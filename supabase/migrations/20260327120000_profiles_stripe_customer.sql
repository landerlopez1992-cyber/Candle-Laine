-- Customer de Stripe por usuario (tarjetas guardadas con Payment Methods).
alter table public.profiles
  add column if not exists stripe_customer_id text not null default '';

comment on column public.profiles.stripe_customer_id is 'Stripe Customer id (cus_...) para Payment Methods del usuario.';
