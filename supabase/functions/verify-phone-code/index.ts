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

function normalizePhoneInput(raw: string): string {
  let s = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (s.startsWith('+')) {
    const rest = s
      .slice(1)
      .replace(/\D/g, '');
    return rest ? `+${rest}` : '';
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : '';
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

  const rawText = await req.text();
  if (!rawText || !rawText.trim()) {
    return jsonResponse({ok: false, error: 'empty_body'}, 400);
  }
  let body: {phone?: string; code?: string};
  try {
    body = JSON.parse(rawText) as {phone?: string; code?: string};
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const phone = normalizePhoneInput(
    typeof body.phone === 'string' ? body.phone : '',
  );
  const code =
    body.code === undefined || body.code === null
      ? ''
      : String(body.code).trim();
  if (!phone || !code) {
    return jsonResponse({ok: false, error: 'missing_fields'}, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const {data: row, error: selError} = await admin
    .from('phone_verifications')
    .select('code, expires_at')
    .eq('phone', phone)
    .maybeSingle();

  if (selError || !row) {
    return jsonResponse({ok: false, error: 'invalid_or_expired'}, 400);
  }

  const expires = new Date(row.expires_at as string).getTime();
  if (Date.now() > expires) {
    await admin.from('phone_verifications').delete().eq('phone', phone);
    return jsonResponse({ok: false, error: 'expired'}, 400);
  }

  if (String(row.code) !== code) {
    return jsonResponse({ok: false, error: 'invalid_code'}, 400);
  }

  await admin.from('phone_verifications').delete().eq('phone', phone);
  return jsonResponse({ok: true});
});
