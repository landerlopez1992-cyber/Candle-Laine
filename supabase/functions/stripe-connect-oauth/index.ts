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

type StripeTokenResponse = {
  access_token?: string;
  livemode?: boolean;
  refresh_token?: string;
  scope?: string;
  stripe_user_id?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

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

  const {data: isAdmin, error: rpcError} = await userClient.rpc('is_admin');
  if (rpcError || isAdmin !== true) {
    return jsonResponse({ok: false, error: 'forbidden'}, 403);
  }

  const rawText = await req.text();
  if (!rawText?.trim()) {
    return jsonResponse({ok: false, error: 'empty_body'}, 400);
  }
  let body: {code?: string; mode?: string};
  try {
    body = JSON.parse(rawText) as {code?: string; mode?: string};
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return jsonResponse({ok: false, error: 'missing_code'}, 400);
  }

  // mode: 'test' | 'live' — determina qué credenciales usar y dónde guardar el acct_...
  const isTestMode = body.mode !== 'live';

  const admin = createClient(supabaseUrl, serviceKey);
  const {data: runtimeData, error: runtimeErr} = await admin
    .from('shop_stripe_runtime')
    .select(
      'use_test_mode, connect_client_id_test, connect_client_id_live, secret_key_test, secret_key_live',
    )
    .eq('id', 'default')
    .maybeSingle();

  if (runtimeErr || !runtimeData) {
    console.error(runtimeErr);
    return jsonResponse({ok: false, error: 'stripe_runtime_missing'}, 500);
  }

  const stripeClientId = String(
    isTestMode
      ? runtimeData.connect_client_id_test ?? ''
      : runtimeData.connect_client_id_live ?? '',
  ).trim();
  const stripeSecret = String(
    isTestMode
      ? runtimeData.secret_key_test ?? ''
      : runtimeData.secret_key_live ?? '',
  ).trim();

  if (!stripeClientId || !stripeSecret) {
    return jsonResponse(
      {
        ok: false,
        error: isTestMode
          ? 'stripe_test_credentials_missing'
          : 'stripe_live_credentials_missing',
      },
      400,
    );
  }

  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('client_secret', stripeSecret);
  params.set('client_id', stripeClientId);

  const stripeRes = await fetch('https://connect.stripe.com/oauth/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params.toString(),
  });

  const tokenJson = (await stripeRes.json()) as StripeTokenResponse;
  if (!stripeRes.ok || !tokenJson.stripe_user_id) {
    const msg =
      tokenJson.error_description ??
      tokenJson.error ??
      'stripe_token_exchange_failed';
    return jsonResponse({ok: false, error: msg}, 400);
  }

  // Guardar account_id en la columna del modo correspondiente (test o live).
  const accountField = isTestMode ? 'account_id_test' : 'account_id_live';
  const {error: runtimeUpError} = await admin
    .from('shop_stripe_runtime')
    .update({[accountField]: tokenJson.stripe_user_id})
    .eq('id', 'default');

  if (runtimeUpError) {
    console.error(runtimeUpError);
    return jsonResponse({ok: false, error: 'db_update_failed'}, 500);
  }

  // Sincronizar shop_payment_settings con el modo actualmente activo.
  const isCurrentMode = isTestMode === Boolean(runtimeData.use_test_mode);
  if (isCurrentMode) {
    await admin
      .from('shop_payment_settings')
      .update({
        stripe_connect_account_id: tokenJson.stripe_user_id,
        stripe_livemode: !isTestMode,
        stripe_enabled: true,
      })
      .eq('id', 'default');
  }

  return jsonResponse({
    ok: true,
    stripe_connect_account_id: tokenJson.stripe_user_id,
    mode: isTestMode ? 'test' : 'live',
  });
});
