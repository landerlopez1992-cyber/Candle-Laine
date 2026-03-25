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
  avatar_url?: string | null;
  phone?: string | null;
  location?: string | null;
  is_blocked?: boolean | null;
  /** Stripe Customer (cus_...) para tarjetas guardadas. */
  stripe_customer_id?: string | null;
};

/** Resumen de tarjeta guardada en Stripe (Payment Method). */
export type StripeSavedCard = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder_name?: string;
};

export type AdminOrderItemRow = {
  id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  image_url?: string | null;
};

/** Claves guardadas en `orders.metadata` (checkout). */
export type OrderMetadata = {
  merchandise_total_cents?: string;
  processing_tax_cents?: string;
  shipping_cents?: string;
  shipping_address_id?: string;
  shipping_address_line?: string;
  payment_method_display?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
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
  metadata?: OrderMetadata | Record<string, unknown> | null;
  profiles: {
    email: string | null;
    full_name: string | null;
    phone?: string | null;
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
  cardLabel?: string;
  installmentsProvider?: 'affirm' | 'klarna';
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

/** Fila singleton `shop_stripe_runtime` (id = 'default', solo admin). */
export type ShopStripeRuntimeRow = {
  id: string;
  use_test_mode: boolean;
  publishable_key_test: string;
  publishable_key_live: string;
  connect_client_id_test: string;
  connect_client_id_live: string;
  secret_key_test: string;
  secret_key_live: string;
  /** acct_... obtenida tras OAuth en modo TEST */
  account_id_test: string;
  /** acct_... obtenida tras OAuth en modo LIVE */
  account_id_live: string;
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
  /** Título / cabecera (texto grande). */
  headline_text: string;
  /** Subtítulo / descripción (texto más pequeño). */
  body_text: string;
  button_label: string;
  updated_at: string;
};

export type ShopCouponType =
  | 'percent_product'
  | 'percent_order'
  | 'free_shipping';

/** Fila `shop_coupons` (cupones creados desde Admin → Ofertas). */
export type ShopCouponRow = {
  id: string;
  code: string;
  coupon_type: ShopCouponType;
  discount_percent: number | null;
  product_id: string | null;
  display_name: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
  updated_at: string;
};

/** Fila `shop_coupon_redemptions` (un uso por usuario y cupón). */
export type ShopCouponRedemptionRow = {
  id: string;
  user_id: string;
  coupon_id: string;
  order_id: string | null;
  used_at: string;
};
