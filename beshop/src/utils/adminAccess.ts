/**
 * Client-side list of admin emails (Profile menu + /admin screen).
 * For server rules use Supabase RLS or Edge Functions with the same allowlist or roles table.
 */
const ADMIN_EMAILS = new Set(['landerlopez1992@gmail.com']);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}
