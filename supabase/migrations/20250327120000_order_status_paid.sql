-- Tras confirmar Zelle en admin, el pedido pasa a `paid` antes de processing/shipped.

do $$ begin
  alter type public.order_status add value 'paid';
exception when duplicate_object then null;
end $$;

comment on column public.orders.status is
  'pending_payment=Zelle pendiente; paid=pago confirmado; created=orden creada (tarjeta); processing; shipped; cancelled';
