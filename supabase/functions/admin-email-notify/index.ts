import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BRAND = 'Candle Laine';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

function buildAdminHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f5f0ea;font-family:Lato,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #545953;padding:28px;">
    <p style="margin:0 0 8px;font-size:12px;color:#4C775C;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(BRAND)} · Admin</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#1C2D18;">${escapeHtml(title)}</h1>
    ${bodyHtml}
    <p style="margin:24px 0 0;font-size:12px;color:#888;">Panel de administración · ${escapeHtml(BRAND)}</p>
  </div></body></html>`;
}

async function sendResend(
  resendKey: string,
  from: string,
  to: string[],
  subject: string,
  html: string,
): Promise<Response> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({from, to, subject, html}),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error('Resend admin error', res.status, errText);
    return jsonResponse(
      {ok: false, error: 'resend_failed', detail: errText.slice(0, 200)},
      502,
    );
  }
  return jsonResponse({ok: true, sent: true});
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: corsHeaders});
  }
  if (req.method !== 'POST') {
    return jsonResponse({ok: false, error: 'method_not_allowed'}, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim() ?? '';

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ok: false, error: 'server_misconfigured'}, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ok: false, error: 'unauthorized'}, 401);
  }

  let body: {type?: string; order_id?: string; user_id?: string};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const type = body.type === 'new_user' ? 'new_user' : 'new_order';
  const orderId = String(body.order_id ?? '').trim();
  const userId = String(body.user_id ?? '').trim();

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {headers: {Authorization: authHeader}},
  });
  const {data: userData, error: userErr} = await userClient.auth.getUser();
  if (userErr || !userData.user?.id) {
    return jsonResponse({ok: false, error: 'unauthorized'}, 401);
  }
  const uid = userData.user.id;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  });

  const {data: settings, error: settingsErr} = await admin
    .from('shop_notification_settings')
    .select('recipient_emails, notify_new_orders, notify_new_users')
    .eq('id', 'default')
    .maybeSingle();

  if (settingsErr) {
    return jsonResponse({ok: false, error: 'settings_read_failed'}, 500);
  }

  const row = settings as {
    recipient_emails?: string[] | null;
    notify_new_orders?: boolean;
    notify_new_users?: boolean;
  } | null;

  const recipients = (row?.recipient_emails ?? [])
    .map((e) => String(e).trim().toLowerCase())
    .filter((e) => e.includes('@'));

  if (!recipients.length) {
    return jsonResponse({ok: true, skipped: true, reason: 'no_recipients'});
  }

  if (type === 'new_order') {
    if (!row?.notify_new_orders) {
      return jsonResponse({ok: true, skipped: true, reason: 'disabled'});
    }
    if (!orderId) {
      return jsonResponse({ok: false, error: 'order_id_required'}, 400);
    }

    const {data: order, error: orderErr} = await admin
      .from('orders')
      .select(
        'id, user_id, status, total_cents, currency, human_order_number, payment_method, created_at',
      )
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return jsonResponse({ok: false, error: 'order_not_found'}, 404);
    }

    const o = order as {
      user_id: string | null;
      status: string;
      total_cents: number;
      currency: string;
      human_order_number: string | null;
      payment_method: string | null;
    };

    if (o.user_id !== uid) {
      return jsonResponse({ok: false, error: 'forbidden'}, 403);
    }

    const humanRef =
      (o.human_order_number ?? '').trim() || orderId.slice(0, 8).toUpperCase();
    const totalLabel = formatMoney(o.total_cents, o.currency || 'USD');

    const {data: prof} = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', o.user_id ?? '')
      .maybeSingle();

    const customerEmail = (prof as {email?: string | null} | null)?.email ?? '';
    const customerName =
      (prof as {full_name?: string | null} | null)?.full_name?.trim() ||
      customerEmail ||
      'Cliente';

    const html = buildAdminHtml(
      `Nuevo pedido · ${humanRef}`,
      `<p style="margin:0 0 12px;font-size:15px;color:#333;line-height:1.5;">Se ha creado un pedido en la tienda.</p>
      <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#666;">Referencia</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(humanRef)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Cliente</td><td style="padding:6px 0;">${escapeHtml(customerName)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${escapeHtml(customerEmail || '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Total</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(totalLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Estado</td><td style="padding:6px 0;">${escapeHtml(o.status)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Pago</td><td style="padding:6px 0;">${escapeHtml(o.payment_method ?? '—')}</td></tr>
      </table>`,
    );

    if (!resendKey) {
      console.warn('admin-email-notify: RESEND_API_KEY not set');
      return jsonResponse({ok: true, skipped: true, reason: 'no_resend'});
    }

    const from =
      Deno.env.get('ORDER_EMAIL_FROM')?.trim() ||
      `Candle Laine <onboarding@resend.dev>`;

    return sendResend(
      resendKey,
      from,
      recipients,
      `${BRAND} · Nuevo pedido ${humanRef}`,
      html,
    );
  }

  // new_user
  if (!row?.notify_new_users) {
    return jsonResponse({ok: true, skipped: true, reason: 'disabled'});
  }
  if (!userId) {
    return jsonResponse({ok: false, error: 'user_id_required'}, 400);
  }
  if (userId !== uid) {
    return jsonResponse({ok: false, error: 'forbidden'}, 403);
  }

  const {data: prof} = await admin
    .from('profiles')
    .select('email, full_name, created_at')
    .eq('id', userId)
    .maybeSingle();

  let email = (prof as {email?: string | null} | null)?.email?.trim() ?? '';
  const fullName =
    (prof as {full_name?: string | null} | null)?.full_name?.trim() ?? '';

  if (!email) {
    const {data: authUser} = await admin.auth.admin.getUserById(userId);
    email = (authUser.user?.email ?? '').trim();
  }

  const html = buildAdminHtml(
    'Nuevo usuario registrado',
    `<p style="margin:0 0 12px;font-size:15px;color:#333;line-height:1.5;">Alguien se ha registrado en la app.</p>
    <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;">Nombre</td><td style="padding:6px 0;">${escapeHtml(fullName || '—')}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(email || '—')}</td></tr>
    </table>`,
  );

  if (!resendKey) {
    console.warn('admin-email-notify: RESEND_API_KEY not set');
    return jsonResponse({ok: true, skipped: true, reason: 'no_resend'});
  }

  const from =
    Deno.env.get('ORDER_EMAIL_FROM')?.trim() ||
    `Candle Laine <onboarding@resend.dev>`;

  return sendResend(
    resendKey,
    from,
    recipients,
    `${BRAND} · Nuevo usuario: ${email || userId.slice(0, 8)}`,
    html,
  );
});
