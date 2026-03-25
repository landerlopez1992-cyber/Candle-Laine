import {createClient, SupabaseClient} from '@supabase/supabase-js';

const url = (process.env.REACT_APP_SUPABASE_URL ?? '').trim();
const anonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY ?? '').trim();

if (process.env.NODE_ENV === 'development' && (!url || !anonKey)) {
  console.warn(
    '[Supabase] Falta REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY. Crea beshop/.env.local y reinicia npm start.',
  );
}

/**
 * Opcional: fetch con timeout (solo si defines REACT_APP_SUPABASE_FETCH_TIMEOUT_MS).
 * Por defecto usamos el `fetch` nativo del navegador — un wrapper forzado rompía
 * el login en algunos entornos aunque el proyecto Supabase estuviera Healthy.
 */
const fetchTimeoutRaw = (process.env.REACT_APP_SUPABASE_FETCH_TIMEOUT_MS ?? '').trim();
const fetchTimeoutMs =
  fetchTimeoutRaw === '' || Number.isNaN(Number(fetchTimeoutRaw))
    ? null
    : Math.max(5000, Number(fetchTimeoutRaw));

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const ms = fetchTimeoutMs ?? 30000;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ms);
  const outerSignal = controller.signal;
  const inner = init?.signal;
  const signal =
    inner &&
    typeof AbortSignal !== 'undefined' &&
    typeof (AbortSignal as unknown as {any?: (s: AbortSignal[]) => AbortSignal})
      .any === 'function'
      ? (AbortSignal as unknown as {any: (s: AbortSignal[]) => AbortSignal}).any([
          outerSignal,
          inner,
        ])
      : outerSignal;
  return fetch(input, {...init, signal}).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

const SINGLETON_KEY = '__supabase_singleton_client__';
const CONFIG_KEY = '__supabase_singleton_config__';

declare global {
  interface Window {
    [SINGLETON_KEY]?: SupabaseClient | null;
    [CONFIG_KEY]?: string;
  }
}

function getOrCreateClient(): SupabaseClient | null {
  const configFingerprint = `${url}|${anonKey}|${fetchTimeoutMs ?? 'native'}`;
  if (
    window[SINGLETON_KEY] !== undefined &&
    window[CONFIG_KEY] === configFingerprint
  ) {
    return window[SINGLETON_KEY] ?? null;
  }

  /**
   * Evita `navigator.locks` (Web Locks API) en operaciones de auth: con varias
   * pestañas, HMR o instancias previas, el lock puede no liberarse y dejar
   * `signInWithPassword` colgado indefinidamente. Un lock no-op ejecuta la
   * operación sin exclusión entre pestañas (aceptable en esta PWA).
   */
  const authLockNoOp = async <R,>(
    _name: string,
    _acquireTimeout: number,
    fn: () => Promise<R>,
  ): Promise<R> => fn();

  const client =
    url && anonKey
      ? createClient(url, anonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            lock: authLockNoOp,
          },
          ...(fetchTimeoutMs != null
            ? {global: {fetch: fetchWithTimeout}}
            : {}),
        })
      : null;

  window[SINGLETON_KEY] = client;
  window[CONFIG_KEY] = configFingerprint;
  return client;
}

/**
 * Cliente Supabase (clave anon, respeta RLS).
 * Configura REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY en `.env.local`.
 *
 * No uses la clave `service_role` en React: solo en backend / Edge Functions.
 */
export const supabase: SupabaseClient | null = getOrCreateClient();

export const isSupabaseConfigured = Boolean(url && anonKey);
