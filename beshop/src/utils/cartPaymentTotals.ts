import type {CartType} from '../store/slices/cartSlice';
import type {ProductType} from '../types';

/**
 * Recovery for Stripe card processing (US-style): 2.9% + $0.30 on the
 * taxable base. Shown as "Tax" in checkout.
 * When shipping is quoted, the base is merchandise (after discounts) + shipping;
 * otherwise only merchandise (cart / Order antes de cotizar envío).
 */
const STRIPE_SURCHARGE_PERCENT = 0.029;
const STRIPE_SURCHARGE_FIXED_USD = 0.3;

export type CartCheckoutTotals = {
  /** Subtotal after promo discount (`cart.total`). */
  merchandiseTotal: number;
  /** Processing pass-through shown as "Tax". */
  processingTax: number;
  /**
   * USPS-style shipping from `shipping-quote` when address is known.
   * `null` = not quoted yet (cart tab, or checkout before quote).
   */
  shippingUsd: number | null;
  /** Amount charged / stored on the order. */
  grandTotal: number;
};

/**
 * Usa el `amount_cents` de la opción seleccionada cuando exista fila en
 * `options`; si no, el valor guardado en Redux. Así tax y total siguen al
 * cambio de método de envío aunque `checkoutShippingUsd` quede desfasado.
 */
export function resolveCheckoutShippingUsd(params: {
  storedUsd: number | null;
  options: Array<{id: string; amount_cents: number}> | null | undefined;
  selectedId: string | null | undefined;
}): number | null {
  const {storedUsd, options, selectedId} = params;
  if (options?.length && selectedId) {
    const row = options.find((o) => o.id === selectedId);
    if (row) {
      return Math.round(row.amount_cents) / 100;
    }
  }
  if (storedUsd != null && Number.isFinite(storedUsd) && storedUsd >= 0) {
    return Math.round(storedUsd * 100) / 100;
  }
  return null;
}

export function computeProcessingTaxUsd(taxableBaseUsd: number): number {
  if (taxableBaseUsd <= 0) {
    return 0;
  }
  const raw =
    taxableBaseUsd * STRIPE_SURCHARGE_PERCENT + STRIPE_SURCHARGE_FIXED_USD;
  return Math.round(raw * 100) / 100;
}

/** Sum of `weight_grams * qty` for catalog items; 0 if weights missing. */
export function totalCartWeightGrams(cart: CartType): number {
  let g = 0;
  for (const p of cart.list) {
    const w = (p as ProductType).weight_grams;
    if (w == null || !Number.isFinite(Number(w)) || Number(w) <= 0) {
      continue;
    }
    g += Number(w) * (p.quantity ?? 1);
  }
  return Math.round(g);
}

/**
 * @param shippingUsd - Omit or pass `null` before shipping is quoted (cart / checkout).
 *   Pass a number (including `0` for free-shipping coupons) once quoted.
 */
export function getCartCheckoutTotals(
  cart: CartType,
  shippingUsd?: number | null,
): CartCheckoutTotals {
  const merchandise = Math.round(cart.total * 100) / 100;
  const ship =
    shippingUsd != null && Number.isFinite(shippingUsd) && shippingUsd >= 0
      ? Math.round(shippingUsd * 100) / 100
      : null;
  const shipPart = ship ?? 0;
  /** Impuesto sobre mercancía + envío cuando el envío ya está cotizado; si no, solo mercancía. */
  const taxableBase = ship != null ? merchandise + shipPart : merchandise;
  const processingTax = computeProcessingTaxUsd(taxableBase);
  const grandTotal = Math.round(
    (merchandise + shipPart + processingTax) * 100,
  ) / 100;
  return {
    merchandiseTotal: merchandise,
    processingTax,
    shippingUsd: ship,
    grandTotal,
  };
}
