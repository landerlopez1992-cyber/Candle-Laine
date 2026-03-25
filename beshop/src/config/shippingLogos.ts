/** Public badges (replace with official brand assets if your legal team approves). */
export const SHIPPING_LOGO_PATHS = {
  usps: '/shipping-logos/usps.png',
  ups: '/shipping-logos/ups.svg',
  estimate: '/shipping-logos/estimate.svg',
} as const;

export type ShippingCarrierUi = 'usps' | 'ups' | 'estimate';
