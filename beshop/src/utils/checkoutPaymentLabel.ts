import type {CheckoutPaymentSelection} from '../store/slices/paymentSlice';

/** True cuando el usuario eligió un método usable (Zelle, tarjeta guardada pm_*, Affirm/Klarna). */
export function isCheckoutPaymentSelectionReady(
  selection: CheckoutPaymentSelection | null,
): boolean {
  if (!selection) {
    return false;
  }
  if (selection.kind === 'zelle') {
    return true;
  }
  if (selection.kind === 'installments') {
    return (
      selection.installmentsProvider === 'affirm' ||
      selection.installmentsProvider === 'klarna'
    );
  }
  if (selection.kind === 'card') {
    return String(selection.cardId ?? '').trim().startsWith('pm_');
  }
  return false;
}

/** Label shown on the checkout «Payment method» row. */
export function getCheckoutPaymentLabel(
  selection: CheckoutPaymentSelection | null,
): string {
  if (!selection) {
    return 'Select a payment method';
  }
  if (selection.kind === 'zelle') {
    return 'Zelle';
  }
  if (selection.kind === 'installments') {
    if (selection.installmentsProvider === 'klarna') {
      return 'Klarna';
    }
    if (selection.installmentsProvider === 'affirm') {
      return 'Affirm';
    }
    return 'Pay in installments';
  }
  if (selection.kind === 'card' && selection.cardId) {
    if (selection.cardLabel?.trim()) {
      return selection.cardLabel.trim();
    }
    return 'Saved card';
  }
  return 'Card';
}
