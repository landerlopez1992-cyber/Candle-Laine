/** Must match public.order_status enum in Supabase. */
export type OrderStatus =
  | 'pending_payment'
  | 'created'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'cancelled';

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

export type AdminOrderItemRow = {
  id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
};

export type OrderRow = {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  human_order_number: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
  order_items?: AdminOrderItemRow[] | null;
};

export const ORDER_STATUS_OPTIONS: {value: OrderStatus; label: string}[] = [
  {value: 'pending_payment', label: 'Pendiente de pago'},
  {value: 'created', label: 'Orden creada'},
  /** Legado en BD; ya no se ofrece en el desplegable (Zelle: pendiente → orden creada). */
  {value: 'paid', label: 'Pagada'},
  {value: 'processing', label: 'Orden procesándose'},
  {value: 'shipped', label: 'Orden enviada'},
  {value: 'cancelled', label: 'Cancelada'},
];

/** Desplegable admin: sin «Pagada»; tras Zelle el admin pasa a «Orden creada». */
export function orderStatusOptionsForAdmin(
  currentStatus: OrderStatus,
): {value: OrderStatus; label: string}[] {
  const withoutPaid = ORDER_STATUS_OPTIONS.filter((o) => o.value !== 'paid');
  if (currentStatus === 'paid') {
    return [
      {value: 'paid', label: 'Pagada (histórico)'},
      ...withoutPaid,
    ];
  }
  return withoutPaid;
}

/** Estado de navegación hacia `CheckoutPaymentDetail`. */
export type CheckoutPaymentDetailState = {
  method: 'zelle' | 'installments' | 'card';
  cardId?: string;
};

/** Fila singleton `shop_payment_settings` (id = 'default'). */
export type ShopPaymentSettingsRow = {
  id: string;
  zelle_enabled: boolean;
  zelle_phone: string;
  zelle_instructions: string;
  stripe_enabled?: boolean;
  /** Cuenta Stripe Connect (acct_...) tras OAuth. */
  stripe_connect_account_id?: string;
  stripe_livemode?: boolean;
  updated_at: string;
};

/** Fila singleton `shop_home_story` (id = 'default'). */
export type ShopHomeStoryRow = {
  id: string;
  title: string;
  body_text: string;
  image_paths: string[];
  updated_at: string;
};

/** Fila singleton `shop_home_countdown` (id = 'default'). */
export type ShopHomeCountdownRow = {
  id: string;
  enabled: boolean;
  product_id: string | null;
  ends_at: string | null;
  body_text: string;
  button_label: string;
  updated_at: string;
};
