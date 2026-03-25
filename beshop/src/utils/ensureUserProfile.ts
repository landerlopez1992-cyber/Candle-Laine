import type {SupabaseClient, User} from '@supabase/supabase-js';

import {formatSupabaseError} from './supabaseError';

/**
 * Garantiza una fila en `public.profiles` para cumplir FKs (`product_reviews`, etc.).
 */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ok: boolean; errorMessage: string | null}> {
  const {data: row, error: selErr} = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (selErr) {
    return {ok: false, errorMessage: formatSupabaseError(selErr)};
  }
  if (row) {
    return {ok: true, errorMessage: null};
  }

  const fullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : '';

  const {error: insErr} = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
  });

  if (!insErr) {
    return {ok: true, errorMessage: null};
  }

  const {data: after} = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (after) {
    return {ok: true, errorMessage: null};
  }

  return {ok: false, errorMessage: formatSupabaseError(insErr)};
}
