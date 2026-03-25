-- Columnas para guardar el acct_... de cada modo por separado (como GoodBarber).
-- TEST y LIVE se vinculan de forma independiente.

alter table public.shop_stripe_runtime
  add column if not exists account_id_test text not null default '',
  add column if not exists account_id_live text not null default '';

comment on column public.shop_stripe_runtime.account_id_test
  is 'acct_... vinculada vía OAuth en modo TEST';
comment on column public.shop_stripe_runtime.account_id_live
  is 'acct_... vinculada vía OAuth en modo LIVE';
