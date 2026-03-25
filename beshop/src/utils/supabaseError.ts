/** Texto legible para mostrar en UI (PostgREST / Postgres / Storage). */
export function formatSupabaseError(
  e: {message?: string; details?: string; hint?: string; code?: string} | null | undefined,
): string {
  if (!e) {
    return 'Error desconocido';
  }
  const msg = e.message ? e.message : String(e);
  const details =
    typeof e.details === 'string' && e.details ? e.details : '';
  const hint = typeof e.hint === 'string' && e.hint ? e.hint : '';
  const code = typeof e.code === 'string' && e.code ? ` [${e.code}]` : '';
  return [msg + code, details, hint].filter(Boolean).join(' · ');
}
