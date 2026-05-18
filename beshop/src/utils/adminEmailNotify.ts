import {supabase} from '../supabaseClient';

/**
 * Alerta al equipo (Edge `admin-email-notify` + Resend).
 * Falla en silencio si no hay sesión o el envío no está configurado.
 */
export async function notifyAdminEmail(params: {
  type: 'new_order' | 'new_user';
  orderId?: string;
  userId?: string;
}): Promise<void> {
  if (!supabase) {
    return;
  }
  const {
    data: {session},
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return;
  }
  const body: Record<string, string> = {type: params.type};
  if (params.orderId) {
    body.order_id = params.orderId;
  }
  if (params.userId) {
    body.user_id = params.userId;
  }
  const {error} = await supabase.functions.invoke('admin-email-notify', {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (error) {
    console.warn('notifyAdminEmail', error.message);
  }
}
