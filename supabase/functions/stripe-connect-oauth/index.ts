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
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const stripeClientId = Deno.env.get('STRIPE_CONNECT_CLIENT_ID') ?? '';

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ok: false, error: 'server_misconfigured'}, 500);
  }
  if (!stripeSecret || !stripeClientId) {
    return jsonResponse({ok: false, error: 'stripe_env_missing'}, 500);
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
  let body: {code?: string};
  try {
    body = JSON.parse(rawText) as {code?: string};
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return jsonResponse({ok: false, error: 'missing_code'}, 400);
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
    return jsonResponse(
      {ok: false, error: msg},
      400,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const {error: upError} = await admin
    .from('shop_payment_settings')
    .update({
      stripe_connect_account_id: tokenJson.stripe_user_id,
      stripe_livemode: Boolean(tokenJson.livemode),
      stripe_enabled: true,
    })
    .eq('id', 'default');

  if (upError) {
    console.error(upError);
    return jsonResponse({ok: false, error: 'db_update_failed'}, 500);
  }

  return jsonResponse({
    ok: true,
    stripe_connect_account_id: tokenJson.stripe_user_id,
    livemode: Boolean(tokenJson.livemode),
  });
});
