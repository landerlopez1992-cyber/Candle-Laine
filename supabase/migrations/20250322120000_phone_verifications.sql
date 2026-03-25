-- OTP SMS (solo accesible con service_role desde Edge Functions)
create table if not exists public.phone_verifications (
  phone text primary key,
  code text not null,
  expires_at timestamptz not null
);

alter table public.phone_verifications enable row level security;

comment on table public.phone_verifications is 'Códigos de verificación SMS; sin políticas públicas (solo service role).';
