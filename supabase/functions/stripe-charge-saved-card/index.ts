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

  let body: {payment_method_id?: string; amount_cents?: number; currency?: string; order_ref?: string};
  try {
    body = (await req.json()) as {
      payment_method_id?: string;
      amount_cents?: number;
      currency?: string;
      order_ref?: string;
    };
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const pmId = typeof body.payment_method_id === 'string'
    ? body.payment_method_id.trim()
    : '';
  const amountCents = Number(body.amount_cents ?? 0);
  const currency = String(body.currency ?? 'usd').toLowerCase().trim() || 'usd';
  const orderRef = String(body.order_ref ?? '').trim();

  if (!pmId.startsWith('pm_')) {
    return jsonResponse({ok: false, error: 'invalid_payment_method'}, 400);
  }
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    return jsonResponse({ok: false, error: 'invalid_amount'}, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
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

  const {data: profile, error: profErr} = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();
  if (profErr || !profile) {
    return jsonResponse({ok: false, error: 'profile_not_found'}, 400);
  }
  const customerId = String(profile.stripe_customer_id ?? '').trim();
  if (!customerId.startsWith('cus_')) {
    return jsonResponse({ok: false, error: 'customer_missing'}, 400);
  }

  const params = new URLSearchParams();
  params.set('amount', String(Math.round(amountCents)));
  params.set('currency', currency);
  params.set('customer', customerId);
  params.set('payment_method', pmId);
  params.set('confirm', 'true');
  params.set('off_session', 'true');
  params.set('description', orderRef ? `Candle Laine order ${orderRef}` : 'Candle Laine order');
  params.set('metadata[supabase_user_id]', userId);
  if (orderRef) {
    params.set('metadata[order_ref]', orderRef);
  }

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
    status?: string;
    amount_received?: number;
    latest_charge?: string;
    error?: {message?: string; code?: string; decline_code?: string};
  };

  if (!payRes.ok) {
    const reason =
      payJson.error?.decline_code ||
      payJson.error?.code ||
      payJson.error?.message ||
      'payment_failed';
    return jsonResponse({ok: false, error: reason}, 400);
  }

  const status = String(payJson.status ?? '');
  if (status !== 'succeeded') {
    return jsonResponse({ok: false, error: status || 'payment_not_succeeded'}, 400);
  }

  return jsonResponse({
    ok: true,
    payment_intent_id: payJson.id ?? '',
    charge_id: payJson.latest_charge ?? '',
    amount_received: Number(payJson.amount_received ?? 0),
    status,
  });
});

