import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';

/** CORS inline: el dashboard de Supabase solo empaqueta esta carpeta (no incluye ../_shared). */
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

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') ?? '';

const E164 = /^\+[1-9]\d{10,14}$/;

/** Normaliza a E.164 y quita espacios / caracteres invisibles (copiar/pegar desde móvil). */
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

function randomFiveDigits(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
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

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return jsonResponse({ok: false, error: 'twilio_not_configured'}, 503);
  }

  const rawText = await req.text();
  if (!rawText || !rawText.trim()) {
    return jsonResponse({ok: false, error: 'empty_body'}, 400);
  }
  let body: {phone?: string};
  try {
    body = JSON.parse(rawText) as {phone?: string};
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const phone = normalizePhoneInput(
    typeof body.phone === 'string' ? body.phone : '',
  );
  if (!phone || !E164.test(phone)) {
    return jsonResponse({ok: false, error: 'invalid_phone_format'}, 400);
  }

  const code = randomFiveDigits();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const admin = createClient(supabaseUrl, serviceKey);
  const {error: dbError} = await admin.from('phone_verifications').upsert(
    {phone, code, expires_at: expiresAt},
    {onConflict: 'phone'},
  );
  if (dbError) {
    console.error('phone_verifications upsert:', dbError);
    return jsonResponse({ok: false, error: 'database_error'}, 500);
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const smsBody = `Your Candle Laine verification code is: ${code}`;

  const form = new URLSearchParams({
    From: TWILIO_PHONE_NUMBER,
    To: phone,
    Body: smsBody,
  });

  const twilioRes = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!twilioRes.ok) {
    const errText = await twilioRes.text();
    console.error('Twilio error:', twilioRes.status, errText);
    await admin.from('phone_verifications').delete().eq('phone', phone);
    return jsonResponse({ok: false, error: 'sms_send_failed'}, 500);
  }

  return jsonResponse({ok: true});
});
