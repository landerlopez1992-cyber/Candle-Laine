const KEY = 'candlelaine_countdown_fs';

export function setCountdownFreeShippingSession(
  productId: string,
  expiresAtMs: number,
): void {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        productId: String(productId).trim(),
        expiresAt: expiresAtMs,
      }),
    );
  } catch {
    /* ignore */
  }
}

export function clearCountdownFreeShippingSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * If the user entered from the home countdown with free shipping and the cart
 * still includes that product, returns its id for the shipping-quote request.
 * Server must re-validate against `shop_home_countdown`.
 */
export function getCountdownFreeShippingProductIdForQuote(
  lines: {product_id: string; quantity: number}[],
): string | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw) as {productId?: string; expiresAt?: number};
    const pid = typeof o.productId === 'string' ? o.productId.trim() : '';
    if (!pid || typeof o.expiresAt !== 'number' || !Number.isFinite(o.expiresAt)) {
      clearCountdownFreeShippingSession();
      return null;
    }
    if (Date.now() > o.expiresAt) {
      clearCountdownFreeShippingSession();
      return null;
    }
    let qty = 0;
    for (const line of lines) {
      if (String(line.product_id) === pid) {
        qty += Math.max(1, Math.floor(Number(line.quantity) || 1));
      }
    }
    if (qty < 1) {
      return null;
    }
    return pid;
  } catch {
    return null;
  }
}
