import {supabase} from '../supabaseClient';

type FnResult = {ok?: boolean; error?: string};

async function errorBodyCode(err: unknown): Promise<string | null> {
  if (!err || typeof err !== 'object' || !('context' in err)) {
    return null;
  }
  const res = (err as {context?: Response}).context;
  if (!res || typeof res.json !== 'function') {
    return null;
  }
  try {
    const payload = (await res.clone().json()) as FnResult;
    return typeof payload.error === 'string' ? payload.error : null;
  } catch {
    return null;
  }
}

async function invoke(
  name: 'send-phone-verification' | 'verify-phone-code',
  body: Record<string, string>,
): Promise<{ok: boolean; error?: string}> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke(name, {body});
  if (error) {
    const fromJson = await errorBodyCode(error);
    return {
      ok: false,
      error: fromJson ?? error.message ?? 'invoke_failed',
    };
  }
  const payload = data as FnResult | null;
  if (payload && payload.ok === false) {
    return {ok: false, error: payload.error ?? 'request_failed'};
  }
  if (payload && payload.ok === true) {
    return {ok: true};
  }
  return {ok: false, error: 'unexpected_response'};
}

export function normalizeE164(input: string): string {
  const t = input.trim();
  if (t.startsWith('+')) {
    return t.replace(/\s/g, '');
  }
  const digits = t.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length >= 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return t.startsWith('+') ? t : `+${digits}`;
}

const E164_STRICT = /^\+[1-9]\d{10,14}$/;

/**
 * Siempre devuelve E.164 con `+` o null.
 * Evita enviar 11 dígitos sin + (body JSON ~24 bytes) que la API rechaza.
 */
export function toE164Strict(input: string): string | null {
  const cleaned = input.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  let s = normalizeE164(cleaned);
  if (!s.startsWith('+')) {
    const d = cleaned.replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) {
      s = `+${d}`;
    } else if (d.length === 10) {
      s = `+1${d}`;
    } else if (d.length > 0) {
      s = `+${d}`;
    }
  }
  return E164_STRICT.test(s) ? s : null;
}

export async function sendPhoneVerificationCode(phone: string) {
  const e164 = toE164Strict(phone);
  if (!e164) {
    return {ok: false, error: 'invalid_phone_format'};
  }
  return invoke('send-phone-verification', {phone: e164});
}

export async function verifyPhoneCode(phone: string, code: string) {
  const e164 = toE164Strict(phone);
  if (!e164) {
    return {ok: false, error: 'invalid_phone_format'};
  }
  return invoke('verify-phone-code', {phone: e164, code});
}
