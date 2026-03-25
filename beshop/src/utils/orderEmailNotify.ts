import {supabase} from '../supabaseClient';
import type {OrderStatus} from '../types/shop';

/**
 * Envía correo transaccional (Edge `order-email-notify` + Resend).
 * Falla en silencio si no hay sesión o el envío no está configurado.
 */
export async function notifyOrderEmail(params: {
  orderId: string;
  reason: 'created' | 'status_updated';
  previousStatus?: OrderStatus | null;
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
  const {error} = await supabase.functions.invoke('order-email-notify', {
    body: {
      order_id: params.orderId,
      reason: params.reason,
      previous_status: params.previousStatus ?? null,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (error) {
    console.warn('notifyOrderEmail', error.message);
  }
}
