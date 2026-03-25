import {supabase} from '../supabaseClient';

const STATE_KEY = 'stripe_oauth_state';

export function getStripeConnectRedirectUri(): string {
  return `${window.location.origin}/admin`;
}

/** Devuelve false si falta REACT_APP_STRIPE_CONNECT_CLIENT_ID. */
export function startStripeConnectOAuth(): boolean {
  const clientId = process.env.REACT_APP_STRIPE_CONNECT_CLIENT_ID?.trim();
  if (!clientId) {
    return false;
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);
  const u = new URL('https://connect.stripe.com/oauth/authorize');
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('scope', 'read_write');
  u.searchParams.set('redirect_uri', getStripeConnectRedirectUri());
  u.searchParams.set('state', state);
  window.location.assign(u.toString());
  return true;
}

type FnPayload = {
  ok?: boolean;
  error?: string;
  stripe_connect_account_id?: string;
  livemode?: boolean;
};

export async function completeStripeConnectOAuth(
  code: string,
  state: string,
): Promise<{ok: boolean; error?: string}> {
  const expected = sessionStorage.getItem(STATE_KEY);
  if (!expected || expected !== state) {
    return {ok: false, error: 'invalid_state'};
  }
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-connect-oauth', {
    body: {code},
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
  const payload = data as FnPayload | null;
  if (payload?.ok === true) {
    sessionStorage.removeItem(STATE_KEY);
    return {ok: true};
  }
  return {ok: false, error: payload?.error ?? 'unexpected_response'};
}
