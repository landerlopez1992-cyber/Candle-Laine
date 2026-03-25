-- Cabecera + subtítulo en el bloque cuenta regresiva (texto 1 grande, texto 2 más pequeño).

alter table public.shop_home_countdown
  add column if not exists headline_text text not null default '';

comment on column public.shop_home_countdown.headline_text is
  'Título / cabecera del bloque (tipografía grande).';
comment on column public.shop_home_countdown.body_text is
  'Subtítulo o descripción bajo la cabecera (tipografía más pequeña).';
