import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}

/** US domestic fallback: approximate Priority Mail–style by weight + zone spread. */
function fallbackShippingCents(
  weightGrams: number,
  destZip: string,
  originZip: string,
): number {
  const oz = Math.max(weightGrams / 28.3495, 1);
  const dest = parseInt(String(destZip).replace(/\D/g, '').slice(0, 5) || '0', 10);
  const origin = parseInt(String(originZip).replace(/\D/g, '').slice(0, 5) || '0', 10);
  const zoneDiff = Math.min(
    8,
    Math.abs(Math.floor(origin / 1000) - Math.floor(dest / 1000)),
  );
  const zoneMult = 1 + zoneDiff * 0.035;
  let baseUsd = 0;
  if (oz <= 8) {
    baseUsd = 5.75;
  } else if (oz <= 16) {
    baseUsd = 7.75;
  } else if (oz <= 32) {
    baseUsd = 9.95;
  } else {
    const extraLb = Math.ceil((oz - 32) / 16);
    baseUsd = 9.95 + extraLb * 1.45;
  }
  baseUsd = Math.min(baseUsd * zoneMult, 165);
  return Math.round(baseUsd * 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: corsHeaders});
  }
  if (req.method !== 'POST') {
    return jsonResponse({ok: false, error: 'method_not_allowed'}, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ok: false, error: 'server_misconfigured'}, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ok: false, error: 'unauthorized'}, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {headers: {Authorization: authHeader}},
  });
  const {data: userData, error: userErr} = await userClient.auth.getUser();
  if (userErr || !userData.user?.id) {
    return jsonResponse({ok: false, error: 'unauthorized'}, 401);
  }
  const userId = userData.user.id;

  let body: {
    shipping_address_id?: string;
    lines?: {product_id: string; quantity: number}[];
    promo_code?: string | null;
    countdown_free_shipping_product_id?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const shipId = String(body.shipping_address_id ?? '').trim();
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!shipId || lines.length === 0) {
    return jsonResponse({ok: false, error: 'address_and_lines_required'}, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const {data: addr, error: addrErr} = await admin
    .from('user_addresses')
    .select(
      'id, user_id, street, municipality, zip, state_code, country_iso2',
    )
    .eq('id', shipId)
    .maybeSingle();

  if (addrErr || !addr || String(addr.user_id) !== userId) {
    return jsonResponse({ok: false, error: 'address_not_found'}, 400);
  }

  const country = String(addr.country_iso2 ?? 'US').toUpperCase().slice(0, 2);
  const destZip = String(addr.zip ?? '').trim();

  const promo = String(body.promo_code ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (promo.length >= 3) {
    const {data: coupon} = await admin
      .from('shop_coupons')
      .select('coupon_type')
      .eq('code', promo)
      .eq('is_active', true)
      .maybeSingle();
    if (coupon && String((coupon as {coupon_type?: string}).coupon_type) === 'free_shipping') {
      return jsonResponse({
        ok: true,
        amount_cents: 0,
        source: 'free_shipping_coupon',
        options: [
          {
            id: 'free_shipping',
            label: 'Free shipping',
            amount_cents: 0,
            carrier: 'estimate',
          },
        ],
      });
    }
  }

  /** UUID v4 pattern — only Supabase shop_products have UUID ids. */
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /** Map of product_id → total quantity, only for valid UUID ids. */
  const qtyByPid = new Map<string, number>();
  for (const line of lines) {
    const pid = String(line.product_id ?? '').trim();
    if (!uuidRe.test(pid)) {
      continue;
    }
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
    qtyByPid.set(pid, (qtyByPid.get(pid) ?? 0) + qty);
  }

  const countdownFsPid = String(
    body.countdown_free_shipping_product_id ?? '',
  ).trim();
  if (countdownFsPid && uuidRe.test(countdownFsPid)) {
    const q = qtyByPid.get(countdownFsPid) ?? 0;
    if (q >= 1) {
      const {data: cdRow} = await admin
        .from('shop_home_countdown')
        .select('product_id, enabled, free_shipping, ends_at')
        .eq('id', 'default')
        .maybeSingle();
      const cd = cdRow as {
        product_id?: string | null;
        enabled?: boolean;
        free_shipping?: boolean;
        ends_at?: string | null;
      } | null;
      if (
        cd &&
        cd.enabled === true &&
        cd.free_shipping === true &&
        String(cd.product_id ?? '').trim() === countdownFsPid &&
        cd.ends_at
      ) {
        const end = new Date(String(cd.ends_at)).getTime();
        if (!Number.isNaN(end) && end > Date.now()) {
          return jsonResponse({
            ok: true,
            amount_cents: 0,
            source: 'countdown_free_shipping',
            options: [
              {
                id: 'countdown_free_shipping',
                label: 'Free shipping',
                amount_cents: 0,
                carrier: 'estimate',
              },
            ],
          });
        }
      }
    }
  }

  let totalGrams = 0;
  if (qtyByPid.size > 0) {
    /** Single IN query — one round-trip regardless of cart size. */
    const ids = Array.from(qtyByPid.keys());
    const {data: prods, error: prodsErr} = await admin
      .from('shop_products')
      .select('id, weight_grams')
      .in('id', ids);
    if (!prodsErr && Array.isArray(prods)) {
      for (const row of prods as {id: string; weight_grams: number | null}[]) {
        const qty = qtyByPid.get(row.id) ?? 1;
        const w = Number(row.weight_grams ?? 0);
        if (Number.isFinite(w) && w > 0) {
          totalGrams += w * qty;
        }
      }
    }
  }

  /** Fallback: 227 g ≈ 8 oz (demo/JSON products or missing weight data). */
  if (totalGrams <= 0) {
    totalGrams = 227;
  }

  const {data: fulfillment} = await admin
    .from('shop_fulfillment')
    .select('ship_from_zip')
    .eq('id', 'default')
    .maybeSingle();

  const originZip =
    String((fulfillment as {ship_from_zip?: string} | null)?.ship_from_zip ?? '').trim() ||
    Deno.env.get('SHIP_FROM_ZIP') ||
    '33470';

  if (country !== 'US') {
    const intlCents = Math.round(Math.min(8 + totalGrams / 500, 85) * 100);
    return jsonResponse({
      ok: true,
      amount_cents: intlCents,
      source: 'international_estimate',
      options: [
        {
          id: 'international_estimated',
          label: 'International (estimated)',
          amount_cents: intlCents,
          carrier: 'estimate',
        },
      ],
    });
  }

  if (!/^\d{5}/.test(destZip)) {
    return jsonResponse({ok: false, error: 'invalid_destination_zip'}, 400);
  }

  const destZip5 = destZip.replace(/\D/g, '').slice(0, 5);
  const originZip5 = originZip.replace(/\D/g, '').slice(0, 5);

  const usps = await quoteUspsDomesticRates({
    originZip: originZip5,
    destZip: destZip5,
    weightGrams: totalGrams,
  });

  /** UPS desactivado en producto: solo USPS API + fallback. (Código UPS conservado abajo por si se reactiva.) */
  const upsOptions: ShippingOptionRow[] = [];

  const fb = fallbackShippingWithOptions(totalGrams, destZip, originZip);
  const merged = mergeCarrierOptions(usps, upsOptions, fb);
  return jsonResponse({
    ok: true,
    amount_cents: merged.amount_cents,
    source: merged.source,
    options: merged.options,
  });
});

/** Base host: `https://apis.usps.com` (prod) or `https://apis-tem.usps.com` (TEM). */
function uspsApiBase(): string {
  const raw = (Deno.env.get('USPS_API_BASE') ?? 'https://apis.usps.com').trim();
  return raw.replace(/\/$/, '');
}

/**
 * OAuth client_credentials — same pattern as USPS api-examples README.
 * Secrets: set `USPS_CLIENT_ID` and `USPS_CLIENT_SECRET` on the Edge Function.
 */
async function getUspsAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get('USPS_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('USPS_CLIENT_SECRET')?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  const base = uspsApiBase();
  const res = await fetch(`${base}/oauth2/v3/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) {
    return null;
  }
  const j = (await res.json()) as {access_token?: string};
  return typeof j.access_token === 'string' ? j.access_token : null;
}

type ShippingCarrier = 'usps' | 'ups' | 'estimate';

type ShippingOptionRow = {
  id: string;
  label: string;
  amount_cents: number;
  carrier: ShippingCarrier;
};

/**
 * USPS (API) + UPS (API) + fallback interno. USPS y UPS son proveedores distintos;
 * la cuenta USPS no incluye datos UPS.
 */
function mergeCarrierOptions(
  uspsBlock: {minCents: number; options: ShippingOptionRow[]} | null,
  upsOptions: ShippingOptionRow[],
  fb: {amount_cents: number; options: ShippingOptionRow[]},
): {amount_cents: number; options: ShippingOptionRow[]; source: string} {
  const u = uspsBlock?.options ?? [];
  const all = [...u, ...upsOptions];
  if (all.length === 0) {
    return {
      amount_cents: fb.amount_cents,
      options: fb.options,
      source: 'us_domestic',
    };
  }
  all.sort((a, b) => a.amount_cents - b.amount_cents);
  let source = 'us_domestic';
  if (u.length > 0 && upsOptions.length > 0) {
    source = 'usps_ups_domestic';
  } else if (u.length > 0) {
    source = 'usps_domestic';
  } else if (upsOptions.length > 0) {
    source = 'ups_domestic';
  }
  return {
    amount_cents: all[0]!.amount_cents,
    options: all,
    source,
  };
}

function upsApiHost(): string {
  return Deno.env.get('UPS_USE_SANDBOX') === 'true'
    ? 'https://wwwcie.ups.com'
    : 'https://onlinetools.ups.com';
}

function upsBasicAuthHeader(clientId: string, clientSecret: string): string {
  const pair = new TextEncoder().encode(`${clientId}:${clientSecret}`);
  let bin = '';
  for (let i = 0; i < pair.length; i++) {
    bin += String.fromCharCode(pair[i]!);
  }
  return `Basic ${btoa(bin)}`;
}

async function getUpsAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get('UPS_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('UPS_CLIENT_SECRET')?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  const host = upsApiHost();
  const res = await fetch(`${host}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: upsBasicAuthHeader(clientId, clientSecret),
      'x-merchant-id': clientId,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    return null;
  }
  const j = (await res.json()) as {access_token?: string};
  return typeof j.access_token === 'string' ? j.access_token : null;
}

/** Rating API — Shop (published rates). Requiere dirección de origen en secretos. */
async function quoteUpsRatingShop(params: {
  originZip5: string;
  dest: {street: string; city: string; state: string; postal: string};
  weightGrams: number;
  dims: {length: number; width: number; height: number};
}): Promise<ShippingOptionRow[]> {
  const clientId = Deno.env.get('UPS_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('UPS_CLIENT_SECRET')?.trim();
  const originStreet = Deno.env.get('UPS_ORIGIN_STREET')?.trim();
  const originCity = Deno.env.get('UPS_ORIGIN_CITY')?.trim();
  const originState = Deno.env.get('UPS_ORIGIN_STATE')?.trim().slice(0, 2);
  const originPostal =
    Deno.env.get('UPS_ORIGIN_POSTAL')?.trim().replace(/\D/g, '').slice(0, 5) ||
    params.originZip5;
  if (!clientId || !clientSecret || !originStreet || !originCity || !originState) {
    return [];
  }
  if (!/^\d{5}$/.test(originPostal) || !/^\d{5}$/.test(params.dest.postal)) {
    return [];
  }
  const token = await getUpsAccessToken();
  if (!token) {
    return [];
  }
  const shipperNum = Deno.env.get('UPS_SHIPPER_NUMBER')?.trim().slice(0, 6);
  const lbs = Math.max(params.weightGrams / 453.59237, 0.01);
  const wStr = String(Math.round(lbs * 100) / 100);
  const {dims} = params;
  const len = String(dims.length);
  const wid = String(dims.width);
  const hgt = String(dims.height);

  const shipperName = Deno.env.get('UPS_SHIPPER_NAME')?.trim() || 'Shipper';
  const rateRequest = {
    RateRequest: {
      Request: {
        RequestOption: 'Shop',
        TransactionReference: {
          CustomerContext: 'CandleLaine',
        },
      },
      Shipment: {
        Shipper: {
          Name: shipperName,
          ...(shipperNum && shipperNum.length === 6 ? {ShipperNumber: shipperNum} : {}),
          Address: {
            AddressLine: [originStreet],
            City: originCity,
            StateProvinceCode: originState,
            PostalCode: originPostal,
            CountryCode: 'US',
          },
        },
        ShipFrom: {
          Name: shipperName,
          Address: {
            AddressLine: [originStreet],
            City: originCity,
            StateProvinceCode: originState,
            PostalCode: originPostal,
            CountryCode: 'US',
          },
        },
        ShipTo: {
          Name: 'Recipient',
          Address: {
            AddressLine: [params.dest.street],
            City: params.dest.city,
            StateProvinceCode: params.dest.state,
            PostalCode: params.dest.postal,
            CountryCode: 'US',
          },
        },
        Package: [
          {
            PackagingType: {
              Code: '02',
              Description: 'Package',
            },
            Dimensions: {
              UnitOfMeasurement: {Code: 'IN', Description: 'Inches'},
              Length: len,
              Width: wid,
              Height: hgt,
            },
            PackageWeight: {
              UnitOfMeasurement: {Code: 'LBS', Description: 'Pounds'},
              Weight: wStr,
            },
          },
        ],
      },
    },
  };

  const host = upsApiHost();
  const transId = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  const res = await fetch(`${host}/api/rating/v2409/Shop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      transId,
      transactionSrc: 'candlelaine',
    },
    body: JSON.stringify(rateRequest),
  });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as {
    RateResponse?: {
      RatedShipment?: unknown;
    };
  };
  const rr = data.RateResponse;
  if (!rr) {
    return [];
  }
  const raw = rr.RatedShipment;
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw != null
      ? [raw]
      : [];
  const out: ShippingOptionRow[] = [];
  for (let i = 0; i < list.length; i++) {
    const row = list[i] as {
      Service?: {Code?: string; Description?: string};
      TotalCharges?: {MonetaryValue?: string; CurrencyCode?: string};
    };
    const mv = row.TotalCharges?.MonetaryValue;
    const price = mv != null ? parseFloat(String(mv)) : NaN;
    if (!Number.isFinite(price) || price < 0) {
      continue;
    }
    const cents = Math.round(price * 100);
    const code = String(row.Service?.Code ?? 'XX').trim();
    const desc = String(row.Service?.Description ?? 'UPS').trim().slice(0, 80);
    const label = desc.length > 0 ? desc : `UPS ${code}`;
    out.push({
      id: `ups_${code}_${i}_${cents}`,
      label,
      amount_cents: cents,
      carrier: 'ups',
    });
  }
  out.sort((a, b) => a.amount_cents - b.amount_cents);
  return out;
}

function fallbackShippingWithOptions(
  weightGrams: number,
  destZip: string,
  originZip: string,
): {amount_cents: number; options: ShippingOptionRow[]} {
  const amount_cents = fallbackShippingCents(weightGrams, destZip, originZip);
  return {
    amount_cents,
    options: [
      {
        id: 'standard_estimated',
        label: 'Standard (estimated)',
        amount_cents,
        carrier: 'estimate',
      },
    ],
  };
}

function formatMailClassLabel(mailClass: string): string {
  return mailClass
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\busps\b/gi, 'USPS')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Default box for rate ingredients when DB has no dimensions (inches). */
function defaultPackageDims(): {length: number; width: number; height: number} {
  const L = Number(Deno.env.get('USPS_DEFAULT_LENGTH_IN') ?? '8');
  const W = Number(Deno.env.get('USPS_DEFAULT_WIDTH_IN') ?? '6');
  const H = Number(Deno.env.get('USPS_DEFAULT_HEIGHT_IN') ?? '4');
  const len = Number.isFinite(L) && L > 0 ? L : 8;
  const wid = Number.isFinite(W) && W > 0 ? W : 6;
  const hgt = Number.isFinite(H) && H > 0 ? H : 4;
  return {length: len, width: wid, height: hgt};
}

/**
 * POST /prices/v3/total-rates/search — build option rows (cheapest first for default total).
 */
async function quoteUspsDomesticRates(params: {
  originZip: string;
  destZip: string;
  weightGrams: number;
}): Promise<{minCents: number; options: ShippingOptionRow[]} | null> {
  const token = await getUspsAccessToken();
  if (!token) {
    return null;
  }
  const {originZip, destZip, weightGrams} = params;
  if (!/^\d{5}$/.test(originZip) || !/^\d{5}$/.test(destZip)) {
    return null;
  }
  const lbs = Math.max(weightGrams / 453.59237, 0.01);
  const dims = defaultPackageDims();
  const base = uspsApiBase();
  const common = {
    originZIPCode: originZip,
    destinationZIPCode: destZip,
    weight: Math.round(lbs * 100) / 100,
    length: dims.length,
    width: dims.width,
    height: dims.height,
    priceType: 'RETAIL',
    mailClasses: [
      'USPS_GROUND_ADVANTAGE',
      'PRIORITY_MAIL',
      'PARCEL_SELECT',
      'PRIORITY_MAIL_EXPRESS',
    ],
  };

  let res = await fetch(`${base}/prices/v3/total-rates/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(common),
  });
  if (!res.ok) {
    res = await fetch(`${base}/prices/v3/total-rates/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...common,
        mailClasses: ['USPS_GROUND_ADVANTAGE', 'PRIORITY_MAIL'],
      }),
    });
  }
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    rateOptions?: Array<{
      totalPrice?: number;
      totalBasePrice?: number;
      rates?: Array<{
        mailClass?: string;
        description?: string;
        productName?: string;
      }>;
    }>;
  };
  const raw = Array.isArray(data.rateOptions) ? data.rateOptions : [];
  const options: ShippingOptionRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const o = raw[i];
    const price =
      typeof o.totalPrice === 'number' && Number.isFinite(o.totalPrice)
        ? o.totalPrice
        : typeof o.totalBasePrice === 'number' && Number.isFinite(o.totalBasePrice)
          ? o.totalBasePrice
          : null;
    if (price == null || price < 0) {
      continue;
    }
    const r0 = o.rates?.[0];
    const mailClass = String(r0?.mailClass ?? 'RATE').trim();
    const desc = String(r0?.description ?? r0?.productName ?? '').trim();
    const label =
      desc.length > 0
        ? desc.slice(0, 80)
        : formatMailClassLabel(mailClass);
    const cents = Math.round(price * 100);
    const id = `usps_${mailClass}_${i}_${cents}`;
    options.push({id, label, amount_cents: cents, carrier: 'usps'});
  }
  if (options.length === 0) {
    return null;
  }
  options.sort((a, b) => a.amount_cents - b.amount_cents);
  const minCents = options[0]!.amount_cents;
  return {minCents, options};
}
