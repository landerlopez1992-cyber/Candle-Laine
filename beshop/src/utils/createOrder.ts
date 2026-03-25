import type {CartType} from '../store/slices/cartSlice';
import type {CheckoutPaymentSelection} from '../store/slices/paymentSlice';
import {supabase} from '../supabaseClient';
import type {ProductType} from '../types';
import {formatSupabaseError} from './supabaseError';

export async function createOrderFromCheckout(params: {
  userId: string;
  cart: CartType;
  checkoutPaymentSelection: CheckoutPaymentSelection | null;
  humanOrderNumber: string;
}): Promise<{orderId: string | null; error: Error | null}> {
  if (!supabase) {
    return {orderId: null, error: new Error('Supabase not configured')};
  }

  const {userId, cart, checkoutPaymentSelection, humanOrderNumber} = params;

  if (!cart.list.length) {
    return {orderId: null, error: new Error('Cart is empty')};
  }

  const totalCents = Math.round(cart.total * 100);
  const paymentKind = checkoutPaymentSelection?.kind ?? 'card';
  const status = paymentKind === 'zelle' ? 'pending_payment' : 'created';

  const {data: orderRow, error: orderErr} = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status,
      total_cents: totalCents,
      currency: 'USD',
      human_order_number: humanOrderNumber,
      payment_method: paymentKind,
      metadata: {},
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

  return {orderId, error: null};
}
