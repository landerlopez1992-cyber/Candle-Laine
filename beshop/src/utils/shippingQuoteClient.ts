import {supabase} from '../supabaseClient';

export type ShippingQuoteOption = {
  id: string;
  label: string;
  amount_cents: number;
  carrier?: 'usps' | 'ups' | 'estimate';
};

/** Solo USPS (y estimaciones genéricas); descarta UPS aunque el Edge Function devuelva filas antiguas. */
function dropUpsOptions(
  options: ShippingQuoteOption[],
): ShippingQuoteOption[] {
  return options.filter((o) => {
    if (o.carrier === 'ups') {
      return false;
    }
    if (o.id.startsWith('ups_')) {
      return false;
    }
    return true;
  });
}

export async function fetchShippingQuoteResult(params: {
  shippingAddressId: string;
  lines: {product_id: string; quantity: number}[];
  promoCode?: string | null;
  /** Product id from home-countdown free-shipping session; server validates. */
  countdownFreeShippingProductId?: string | null;
}): Promise<
  | {ok: true; usd: number; options: ShippingQuoteOption[]; source: string}
  | {ok: false; error: string}
> {
  if (!supabase) {
    return {ok: false, error: 'App not configured.'};
  }
  const {data, error} = await supabase.functions.invoke('shipping-quote', {
    body: {
      shipping_address_id: params.shippingAddressId,
      lines: params.lines,
      promo_code: params.promoCode ?? null,
      countdown_free_shipping_product_id:
        params.countdownFreeShippingProductId ?? null,
    },
  });
  if (error) {
    return {ok: false, error: error.message || 'Shipping quote failed.'};
  }
  const p = data as {
    ok?: boolean;
    amount_cents?: number;
    options?: ShippingQuoteOption[];
    source?: string;
    error?: string;
  } | null;
  if (p?.ok !== true || typeof p.amount_cents !== 'number' || p.amount_cents < 0) {
    return {ok: false, error: p?.error ?? 'Shipping quote failed.'};
  }
  const rawOpts = Array.isArray(p.options) ? p.options : [];
  const options: ShippingQuoteOption[] =
    rawOpts.length > 0
      ? dropUpsOptions(
          rawOpts.map((o) => ({
            id: String(o.id ?? ''),
            label: String(o.label ?? 'Shipping'),
            amount_cents: Math.max(0, Math.round(Number(o.amount_cents) || 0)),
            carrier:
              o.carrier === 'usps' || o.carrier === 'ups' || o.carrier === 'estimate'
                ? o.carrier
                : undefined,
          })),
        )
      : [
          {
            id: 'default',
            label: 'Shipping',
            amount_cents: p.amount_cents,
          },
        ];
  const sorted = [...options].sort((a, b) => a.amount_cents - b.amount_cents);
  if (sorted.length === 0) {
    return {ok: false, error: 'Shipping quote failed.'};
  }
  const first = sorted[0]!;
  return {
    ok: true,
    usd: first.amount_cents / 100,
    options: sorted,
    source: typeof p.source === 'string' ? p.source : '',
  };
}

/** @deprecated Prefer `fetchShippingQuoteResult` for option lists. */
export async function fetchShippingQuoteUsd(params: {
  shippingAddressId: string;
  lines: {product_id: string; quantity: number}[];
  promoCode?: string | null;
  countdownFreeShippingProductId?: string | null;
}): Promise<{ok: true; usd: number} | {ok: false; error: string}> {
  const r = await fetchShippingQuoteResult(params);
  if (!r.ok) {
    return r;
  }
  return {ok: true, usd: r.usd};
}
