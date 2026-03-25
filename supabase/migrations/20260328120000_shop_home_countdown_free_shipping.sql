-- Countdown promo: optional free shipping when buying the featured product via that offer.
alter table public.shop_home_countdown
  add column if not exists free_shipping boolean not null default false;

comment on column public.shop_home_countdown.free_shipping is
  'When true and offer is active, shipping quote is $0 if the cart includes the countdown product (validated in shipping-quote Edge Function).';
