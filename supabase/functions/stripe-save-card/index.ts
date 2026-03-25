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

async function stripeForm(
  secret: string,
  path: string,
  method: string,
  params: Record<string, string>,
): Promise<Response> {
  const body = new URLSearchParams(params);
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : body.toString(),
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
  const email = userData.user.email ?? '';

  let body: {payment_method_id?: string};
  try {
    body = (await req.json()) as {payment_method_id?: string};
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }
  const pmId = typeof body.payment_method_id === 'string'
    ? body.payment_method_id.trim()
    : '';
  if (!pmId.startsWith('pm_')) {
    return jsonResponse({ok: false, error: 'invalid_payment_method'}, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const {data: runtime, error: rtErr} = await admin
    .from('shop_stripe_runtime')
    .select('use_test_mode, secret_key_test, secret_key_live')
    .eq('id', 'default')
    .maybeSingle();

  if (rtErr || !runtime) {
    console.error(rtErr);
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
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    console.error(profErr);
    return jsonResponse({ok: false, error: 'profile_lookup_failed'}, 500);
  }

  // Algunos usuarios antiguos pueden no tener fila en `profiles`.
  // La creamos automáticamente para no bloquear el guardado de tarjeta.
  if (!profile) {
    const {error: insErr} = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email || null,
          full_name: '',
        },
        {onConflict: 'id'},
      );
    if (insErr) {
      console.error(insErr);
      return jsonResponse({ok: false, error: 'profile_create_failed'}, 500);
    }
  }

  const {data: profileReady, error: profileReadyErr} = await admin
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();

  if (profileReadyErr || !profileReady) {
    console.error(profileReadyErr);
    return jsonResponse({ok: false, error: 'profile_not_ready'}, 500);
  }

  let customerId = String(profileReady.stripe_customer_id ?? '').trim();

  if (!customerId) {
    const custEmail = (email || String(profileReady.email ?? '')).trim();
    const custParams: Record<string, string> = {
      'metadata[supabase_user_id]': userId,
    };
    if (custEmail) {
      custParams.email = custEmail;
    }
    const custRes = await stripeForm(secret, 'customers', 'POST', custParams);
    const custJson = (await custRes.json()) as {id?: string; error?: {message?: string}};
    if (!custRes.ok || !custJson.id) {
      return jsonResponse(
        {
          ok: false,
          error: custJson.error?.message ?? 'stripe_customer_create_failed',
        },
        400,
      );
    }
    customerId = custJson.id;
    const {error: upErr} = await admin
      .from('profiles')
      .update({stripe_customer_id: customerId})
      .eq('id', userId);
    if (upErr) {
      console.error(upErr);
      return jsonResponse({ok: false, error: 'db_update_failed'}, 500);
    }
  }

  const attachRes = await stripeForm(
    secret,
    `payment_methods/${encodeURIComponent(pmId)}/attach`,
    'POST',
    {customer: customerId},
  );
  const attachJson = (await attachRes.json()) as {
    id?: string;
    card?: {brand?: string; last4?: string; exp_month?: number; exp_year?: number};
    error?: {message?: string};
  };

  if (!attachRes.ok) {
    return jsonResponse(
      {ok: false, error: attachJson.error?.message ?? 'attach_failed'},
      400,
    );
  }

  return jsonResponse({
    ok: true,
    customer_id: customerId,
    payment_method: {
      id: attachJson.id ?? pmId,
      brand: attachJson.card?.brand ?? 'card',
      last4: attachJson.card?.last4 ?? '',
      exp_month: attachJson.card?.exp_month ?? 0,
      exp_year: attachJson.card?.exp_year ?? 0,
    },
  });
});
