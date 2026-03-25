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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ok: false, error: 'server_misconfigured'}, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const {data, error} = await admin
    .from('shop_stripe_runtime')
    .select('use_test_mode, publishable_key_test, publishable_key_live')
    .eq('id', 'default')
    .maybeSingle();

  if (error || !data) {
    console.error(error);
    return jsonResponse({ok: false, error: 'stripe_runtime_missing'}, 500);
  }

  const useTest = Boolean(data.use_test_mode);
  const publishableKey = String(
    useTest ? data.publishable_key_test ?? '' : data.publishable_key_live ?? '',
  ).trim();

  if (!publishableKey.startsWith('pk_')) {
    return jsonResponse(
      {
        ok: false,
        error: useTest ? 'publishable_key_test_missing' : 'publishable_key_live_missing',
      },
      400,
    );
  }

  return jsonResponse({
    ok: true,
    publishableKey,
    mode: useTest ? 'test' : 'live',
  });
});
