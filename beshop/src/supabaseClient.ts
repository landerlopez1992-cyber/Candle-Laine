import {createClient} from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL ?? '';
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY ?? '';

/**
 * Cliente Supabase (clave anon, respeta RLS).
 * Configura REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY en `.env.local`.
 *
 * No uses la clave `service_role` en React: solo en backend / Edge Functions.
 */
export const supabase =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = Boolean(url && anonKey);
