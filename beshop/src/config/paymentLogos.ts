import type {InstallmentsProvider} from '../store/slices/paymentSlice';

/** PNG copiados de `land_go_travel/assets/images/payment_logos` → `public/payment-logos/`. */
const publicBase = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');

export function bnplLogoUrl(provider: InstallmentsProvider): string {
  const file =
    provider === 'affirm' ? 'affirm_logo.png' : 'klarna_logo.png';
  return `${publicBase}/payment-logos/${file}`;
}
