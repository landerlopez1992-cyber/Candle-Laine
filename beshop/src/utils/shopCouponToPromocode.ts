import type {PromocodeType} from '../types';
import type {ShopCouponRow} from '../types/shop';

export function shopCouponRowToPromocode(
  row: ShopCouponRow,
  usedAtIso?: string | null,
): PromocodeType {
  const isFree = row.coupon_type === 'free_shipping';
  let expiry: string;
  if (usedAtIso) {
    expiry = `Used ${new Date(usedAtIso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`;
  } else if (row.ends_at) {
    expiry = new Date(row.ends_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } else {
    expiry = 'Sin fecha límite';
  }
  return {
    id: row.id,
    name: row.display_name?.trim() || 'Candle Laine',
    code: row.code,
    image: '',
    expiry,
    discount: isFree ? 0 : (row.discount_percent ?? 0),
    isFreeShipping: isFree,
  };
}
