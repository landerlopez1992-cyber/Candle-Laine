import type {CartType} from '../store/slices/cartSlice';
import type {CheckoutPaymentSelection} from '../store/slices/paymentSlice';

/** Clave única para el respaldo de BNPL entre checkout y la vuelta desde Affirm/Klarna. */
export const BNPL_RETURN_STORAGE_KEY = 'candle_bnpl_return';

export type BnplReturnStored = {
  orderRef: string;
  paymentIntentId: string;
  /** Snapshot del carrito en el momento del redirect (se pierde en Redux tras la navegación). */
  cart: CartType;
  /** Método de pago seleccionado (installmentsProvider, etc.). */
  paymentSelection: CheckoutPaymentSelection;
  /** ID de la dirección de envío elegida. */
  shippingAddressId: string;
  /** Línea formateada de la dirección de envío. */
  shippingAddressLine: string;
  /** Cotización de envío (USD) al iniciar BNPL. */
  shippingUsd: number;
};

export function readBnplReturnStored(): BnplReturnStored | null {
  try {
    const raw = sessionStorage.getItem(BNPL_RETURN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const j = JSON.parse(raw) as Partial<BnplReturnStored>;
    const orderRef = typeof j.orderRef === 'string' ? j.orderRef.trim() : '';
    const paymentIntentId =
      typeof j.paymentIntentId === 'string' ? j.paymentIntentId.trim() : '';
    const shipUsd =
      typeof j.shippingUsd === 'number' && Number.isFinite(j.shippingUsd)
        ? j.shippingUsd
        : 0;
    if (
      orderRef &&
      paymentIntentId.startsWith('pi_') &&
      j.cart &&
      Array.isArray(j.cart.list) &&
      j.paymentSelection &&
      j.shippingAddressId &&
      j.shippingAddressLine
    ) {
      return {
        orderRef,
        paymentIntentId,
        cart: j.cart,
        paymentSelection: j.paymentSelection,
        shippingAddressId: j.shippingAddressId,
        shippingAddressLine: j.shippingAddressLine,
        shippingUsd: shipUsd,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeBnplReturnStored(data: BnplReturnStored): void {
  try {
    sessionStorage.setItem(BNPL_RETURN_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function clearBnplReturnStored(): void {
  try {
    sessionStorage.removeItem(BNPL_RETURN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
