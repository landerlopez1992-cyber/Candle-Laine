import {CHECKOUT_CREDIT_CARDS} from '../constants/checkoutPayment';
import type {CheckoutPaymentSelection} from '../store/slices/paymentSlice';

/** Texto que se muestra en la tarjeta «Payment method» del checkout. */
export function getCheckoutPaymentLabel(
  selection: CheckoutPaymentSelection | null,
): string {
  if (!selection) {
    return 'Selecciona método de pago';
  }
  if (selection.kind === 'zelle') {
    return 'Zelle';
  }
  if (selection.kind === 'installments') {
    return 'Pagar en cuotas';
  }
  if (selection.kind === 'card' && selection.cardId) {
    const c = CHECKOUT_CREDIT_CARDS.find((x) => x.id === selection.cardId);
    return c?.number ?? 'Tarjeta';
  }
  return 'Tarjeta';
}
