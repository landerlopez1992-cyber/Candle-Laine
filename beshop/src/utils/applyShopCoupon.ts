import {supabase} from '../supabaseClient';
import type {CartType} from '../store/slices/cartSlice';
import type {ShopCouponRow} from '../types/shop';

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Valida cupón de `shop_coupons` y que el usuario no lo haya canjeado ya.
 * El canje en BD ocurre al crear el pedido (ver `createOrder`).
 */
export async function validateAndApplyShopCoupon(params: {
  code: string;
  userId: string;
  cart: CartType;
}): Promise<
  {ok: true; discountPercent: number; codeNormalized: string} | {ok: false; message: string}
> {
  const {userId, cart} = params;
  const c = normalizeCouponCode(params.code);
  if (c.length < 3) {
    return {ok: false, message: 'Enter a valid code.'};
  }
  if (!supabase) {
    return {ok: false, message: 'Unavailable.'};
  }

  const {data: coupon, error: qErr} = await supabase
    .from('shop_coupons')
    .select('*')
    .eq('code', c)
    .maybeSingle();

  if (qErr || !coupon) {
    return {ok: false, message: 'Invalid or expired code.'};
  }

  const row = coupon as ShopCouponRow;

  if (!row.is_active) {
    return {ok: false, message: 'This code is no longer active.'};
  }
  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    return {ok: false, message: 'This code is not valid yet.'};
  }
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) {
    return {ok: false, message: 'This code has expired.'};
  }

  const {data: already} = await supabase
    .from('shop_coupon_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', row.id)
    .maybeSingle();

  if (already) {
    return {ok: false, message: 'You already used this code.'};
  }

  if (row.coupon_type === 'percent_product') {
    const pid = row.product_id;
    if (
      !pid ||
      !cart.list.some((p) => String(p.id) === String(pid))
    ) {
      return {
        ok: false,
        message: 'Add the discounted product to your cart to use this code.',
      };
    }
  }

  if (row.coupon_type === 'free_shipping') {
    return {ok: true, discountPercent: 0, codeNormalized: c};
  }

  const pct = row.discount_percent ?? 0;
  if (pct < 1 || pct > 100) {
    return {ok: false, message: 'Invalid coupon configuration.'};
  }

  return {ok: true, discountPercent: pct, codeNormalized: c};
}
