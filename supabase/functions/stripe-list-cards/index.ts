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

  const admin = createClient(supabaseUrl, serviceKey);
  const {data: profile, error: profErr} = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  if (profErr || !profile) {
    return jsonResponse({ok: false, error: 'profile_not_found'}, 400);
  }

  const customerId = String(profile.stripe_customer_id ?? '').trim();
  if (!customerId) {
    return jsonResponse({ok: true, cards: []});
  }

  const {data: runtime, error: rtErr} = await admin
    .from('shop_stripe_runtime')
    .select('use_test_mode, secret_key_test, secret_key_live')
    .eq('id', 'default')
    .maybeSingle();

  if (rtErr || !runtime) {
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

  const qs = new URLSearchParams({type: 'card', limit: '20'});
  const listRes = await fetch(
    `https://api.stripe.com/v1/customers/${encodeURIComponent(customerId)}/payment_methods?${qs}`,
    {headers: {Authorization: `Bearer ${secret}`}},
  );
  const listJson = (await listRes.json()) as {
    data?: Array<{
      id: string;
      card?: {brand?: string; last4?: string; exp_month?: number; exp_year?: number};
      billing_details?: {name?: string};
    }>;
    error?: {message?: string};
  };

  if (!listRes.ok) {
    return jsonResponse(
      {ok: false, error: listJson.error?.message ?? 'list_failed'},
      400,
    );
  }

  const cards = (listJson.data ?? []).map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? 'card',
    last4: pm.card?.last4 ?? '',
    exp_month: pm.card?.exp_month ?? 0,
    exp_year: pm.card?.exp_year ?? 0,
    holder_name: pm.billing_details?.name ?? '',
  }));

  return jsonResponse({ok: true, cards});
});
