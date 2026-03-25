import {supabase} from '../supabaseClient';

// state = base64url({uuid, mode}) para saber qué modo restaurar en el callback.
type StatePayload = {uuid: string; mode: 'test' | 'live'};

const STATE_KEY = 'stripe_oauth_state';

export function getStripeConnectRedirectUri(): string {
  return `${window.location.origin}/admin`;
}

function encodeState(payload: StatePayload): string {
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeState(raw: string): StatePayload | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return JSON.parse(atob(padded + pad)) as StatePayload;
  } catch {
    return null;
  }
}

/**
 * Arranca el flujo OAuth para el modo indicado.
 * Devuelve false si falta el clientId para ese modo.
 */
export function startStripeConnectOAuth(clientId: string, mode: 'test' | 'live'): boolean {
  const id = clientId.trim();
  if (!id) {
    return false;
  }
  const payload: StatePayload = {uuid: crypto.randomUUID(), mode};
  const stateStr = encodeState(payload);
  sessionStorage.setItem(STATE_KEY, stateStr);

  const u = new URL('https://connect.stripe.com/oauth/authorize');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', id);
  u.searchParams.set('scope', 'read_write');
  u.searchParams.set('redirect_uri', getStripeConnectRedirectUri());
  u.searchParams.set('state', stateStr);
  window.location.assign(u.toString());
  return true;
}

type FnPayload = {
  ok?: boolean;
  error?: string;
  stripe_connect_account_id?: string;
  mode?: string;
};

export async function completeStripeConnectOAuth(
  code: string,
  state: string,
): Promise<{ok: boolean; error?: string; mode?: 'test' | 'live'}> {
  const stored = sessionStorage.getItem(STATE_KEY);
  if (!stored || stored !== state) {
    return {ok: false, error: 'invalid_state'};
  }

  const payload = decodeState(stored);
  const mode: 'test' | 'live' = payload?.mode ?? 'test';

  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }

  const {data, error} = await supabase.functions.invoke('stripe-connect-oauth', {
    body: {code, mode},
  });

  if (error) {
    let msg = error.message ?? 'invoke_failed';
    try {
      const ctx = (error as {context?: Response}).context;
      if (ctx && typeof ctx.json === 'function') {
        const j = (await ctx.clone().json()) as FnPayload;
        if (typeof j.error === 'string') {
          msg = j.error;
        }
      }
    } catch {
      /* ignore */
    }
    return {ok: false, error: msg};
  }

  const fnPayload = data as FnPayload | null;
  if (fnPayload?.ok === true) {
    sessionStorage.removeItem(STATE_KEY);
    return {ok: true, mode};
  }
  return {ok: false, error: fnPayload?.error ?? 'unexpected_response'};
}
