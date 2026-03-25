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

type BnplProvider = 'klarna' | 'affirm';

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
    provider?: string;
    amount_cents?: number;
    currency?: string;
    order_ref?: string;
    shipping_address_id?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const provider = String(body.provider ?? '').toLowerCase().trim() as BnplProvider;
  if (provider !== 'klarna' && provider !== 'affirm') {
    return jsonResponse({ok: false, error: 'invalid_provider'}, 400);
  }

  const amountCents = Number(body.amount_cents ?? 0);
  const currency = String(body.currency ?? 'usd').toLowerCase().trim() || 'usd';
  const orderRef = String(body.order_ref ?? '').trim();
  const shipId = String(body.shipping_address_id ?? '').trim();

  if (!orderRef || orderRef.length < 4) {
    return jsonResponse({ok: false, error: 'invalid_order_ref'}, 400);
  }
  if (!shipId) {
    return jsonResponse({ok: false, error: 'shipping_address_required'}, 400);
  }
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    return jsonResponse({ok: false, error: 'invalid_amount'}, 400);
  }

  // Affirm (US) typically requires >= $50 USD — https://docs.stripe.com/payments/affirm
  if (provider === 'affirm' && currency === 'usd' && amountCents < 5000) {
    return jsonResponse({ok: false, error: 'affirm_minimum_usd_50'}, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  /** Solo validamos que la dirección sea del usuario; el envío lo envía el cliente al confirmar con pk_ (Stripe no permite mezclar shipping puesto con sk_ y luego cambiarlo con pk_). */
  const {data: addr, error: addrErr} = await admin
    .from('user_addresses')
    .select('id, user_id')
    .eq('id', shipId)
    .maybeSingle();

  if (addrErr || !addr || String(addr.user_id) !== userId) {
    return jsonResponse({ok: false, error: 'address_not_found'}, 400);
  }

  const {data: runtime, error: runtimeErr} = await admin
    .from('shop_stripe_runtime')
    .select('use_test_mode, secret_key_test, secret_key_live')
    .eq('id', 'default')
    .maybeSingle();
  if (runtimeErr || !runtime) {
    return jsonResponse({ok: false, error: 'stripe_runtime_missing'}, 500);
  }

  const useTest = Boolean(runtime.use_test_mode);
  const secret = String(
    useTest ? runtime.secret_key_test ?? '' : runtime.secret_key_live ?? '',
  ).trim();
  if (!secret.startsWith('sk_')) {
    return jsonResponse(
      {ok: false, error: useTest ? 'secret_key_test_missing' : 'secret_key_live_missing'},
      400,
    );
  }

  const params = new URLSearchParams();
  params.set('amount', String(Math.round(amountCents)));
  params.set('currency', currency);
  params.append('payment_method_types[]', provider);
  params.set('metadata[supabase_user_id]', userId);
  params.set('metadata[order_ref]', orderRef);
  params.set('metadata[bnpl_provider]', provider);
  params.set('description', `Candle Laine order ${orderRef}`);

  const payRes = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const payJson = (await payRes.json()) as {
    id?: string;
    client_secret?: string;
    error?: {message?: string; code?: string};
  };

  if (!payRes.ok) {
    const msg = payJson.error?.message || payJson.error?.code || 'stripe_error';
    return jsonResponse({ok: false, error: msg}, 400);
  }

  const clientSecret = String(payJson.client_secret ?? '');
  const piId = String(payJson.id ?? '');
  if (!clientSecret || !piId) {
    return jsonResponse({ok: false, error: 'no_client_secret'}, 500);
  }

  return jsonResponse({
    ok: true,
    client_secret: clientSecret,
    payment_intent_id: piId,
  });
});
