import type {CartType} from '../store/slices/cartSlice';
import type {CheckoutPaymentSelection} from '../store/slices/paymentSlice';
import {supabase} from '../supabaseClient';
import type {ProductType} from '../types';
import {isCheckoutPaymentSelectionReady} from './checkoutPaymentLabel';
import {getCartCheckoutTotals} from './cartPaymentTotals';
import {formatSupabaseError} from './supabaseError';
import {normalizeCouponCode} from './applyShopCoupon';
import {clearCountdownFreeShippingSession} from './countdownFreeShippingSession';

async function recordCouponRedemption(
  userId: string,
  orderId: string,
  promoCode: string | undefined,
): Promise<void> {
  if (!supabase || !promoCode?.trim()) {
    return;
  }
  const code = normalizeCouponCode(promoCode);
  if (code.length < 2) {
    return;
  }
  const {data: coupon} = await supabase
    .from('shop_coupons')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (!coupon?.id) {
    return;
  }
  const {error} = await supabase.from('shop_coupon_redemptions').insert({
    user_id: userId,
    coupon_id: coupon.id as string,
    order_id: orderId,
  });
  if (error && (error as {code?: string}).code !== '23505') {
    console.warn('recordCouponRedemption', error);
  }
}

export type OrderPaymentMetadata = {
  payment_method_display: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
};

export async function createOrderFromCheckout(params: {
  userId: string;
  cart: CartType;
  checkoutPaymentSelection: CheckoutPaymentSelection | null;
  humanOrderNumber: string;
  /** Dirección de envío elegida (`user_addresses`). */
  shippingAddressId?: string | null;
  shippingAddressLine?: string | null;
  /** Texto legible + ids Stripe para auditoría (va a `orders.metadata`). */
  paymentMetadata?: OrderPaymentMetadata | null;
  /** Quoted shipping (USD), incl. 0 for free-shipping coupons. Required when shipping address is set. */
  shippingUsd: number;
}): Promise<{orderId: string | null; error: Error | null}> {
  if (!supabase) {
    return {orderId: null, error: new Error('Supabase not configured')};
  }

  const {
    userId,
    cart,
    checkoutPaymentSelection,
    humanOrderNumber,
    shippingAddressId,
    shippingAddressLine,
    paymentMetadata,
    shippingUsd,
  } = params;

  if (!cart.list.length) {
    return {orderId: null, error: new Error('Cart is empty')};
  }

  if (!isCheckoutPaymentSelectionReady(checkoutPaymentSelection)) {
    return {
      orderId: null,
      error: new Error('Select a payment method before placing your order.'),
    };
  }

  if (
    shippingAddressId &&
    shippingAddressLine?.trim() &&
    (!Number.isFinite(shippingUsd) || shippingUsd < 0)
  ) {
    return {
      orderId: null,
      error: new Error('Shipping could not be calculated. Please try again.'),
    };
  }

  const checkoutTotals = getCartCheckoutTotals(cart, shippingUsd);
  const totalCents = Math.round(checkoutTotals.grandTotal * 100);

  const paymentMethodDb = (() => {
    const sel = checkoutPaymentSelection;
    if (!sel) {
      return 'card';
    }
    if (sel.kind === 'zelle') {
      return 'zelle';
    }
    if (sel.kind === 'card') {
      return 'card';
    }
    if (sel.kind === 'installments') {
      if (sel.installmentsProvider === 'klarna') {
        return 'installments_klarna';
      }
      if (sel.installmentsProvider === 'affirm') {
        return 'installments_affirm';
      }
      return 'installments';
    }
    return 'card';
  })();

  const status =
    checkoutPaymentSelection?.kind === 'zelle' ? 'pending_payment' : 'created';

  const metadata: Record<string, string> = {};
  metadata.merchandise_total_cents = String(
    Math.round(checkoutTotals.merchandiseTotal * 100),
  );
  metadata.processing_tax_cents = String(
    Math.round(checkoutTotals.processingTax * 100),
  );
  metadata.shipping_cents = String(Math.round(shippingUsd * 100));
  if (shippingAddressId && shippingAddressLine?.trim()) {
    metadata.shipping_address_id = shippingAddressId;
    metadata.shipping_address_line = shippingAddressLine.trim();
  }

  const pm = paymentMetadata;
  if (pm?.payment_method_display?.trim()) {
    metadata.payment_method_display = pm.payment_method_display.trim();
  }
  if (pm?.stripe_payment_intent_id?.trim()) {
    metadata.stripe_payment_intent_id = pm.stripe_payment_intent_id.trim();
  }
  if (pm?.stripe_charge_id?.trim()) {
    metadata.stripe_charge_id = pm.stripe_charge_id.trim();
  }

  const {data: orderRow, error: orderErr} = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status,
      total_cents: totalCents,
      currency: 'USD',
      human_order_number: humanOrderNumber,
      payment_method: paymentMethodDb,
      metadata,
    })
    .select('id')
    .single();

  if (orderErr || !orderRow) {
    return {
      orderId: null,
      error: new Error(formatSupabaseError(orderErr)),
    };
  }

  const orderId = orderRow.id as string;

  const items = cart.list.map((p: ProductType) => ({
    order_id: orderId,
    product_id: typeof p.id === 'string' ? p.id : null,
    name: p.name,
    image_url: p.image || null,
    unit_price_cents: Math.round(Number(p.price) * 100),
    quantity: p.quantity ?? 1,
  }));

  const {error: itemsErr} = await supabase.from('order_items').insert(items);

  if (itemsErr) {
    await supabase.from('orders').delete().eq('id', orderId);
    return {orderId: null, error: new Error(formatSupabaseError(itemsErr))};
  }

  await supabase.from('user_cart_items').delete().eq('user_id', userId);

  await recordCouponRedemption(userId, orderId, cart.promoCode);

  clearCountdownFreeShippingSession();

  return {orderId, error: null};
}
