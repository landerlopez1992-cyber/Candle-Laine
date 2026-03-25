import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Candle Laine palette (theme) — inline CSS only for email clients. */
const C = {
  shell: '#1C2D18',
  band: '#4B3C35',
  text: '#D6C0A5',
  muted: '#B8A894',
  accent: '#F1B97F',
  white: '#FFFFFF',
  border: '#545953',
  sage: '#4C775C',
};

const BRAND = {
  name: 'Candle Laine',
  email: Deno.env.get('COMPANY_EMAIL') ?? 'info@candle-laine.com',
  address1: Deno.env.get('COMPANY_ADDRESS_LINE1') ?? '13804 73rd ST N',
  address2:
    Deno.env.get('COMPANY_ADDRESS_LINE2') ?? 'West Palm Beach, FL 33412',
  phones: Deno.env.get('COMPANY_PHONES') ?? '(772) 985-1015 · (561) 315-5227',
  site: Deno.env.get('PUBLIC_SITE_URL') ?? 'https://candle-laine.com',
};

const STATUS_EN: Record<string, string> = {
  pending_payment: 'Payment pending',
  created: 'Order placed',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

type OrderLine = {
  name: string;
  quantity: number;
  unit_price_cents: number;
  image_url: string | null;
};

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

function absoluteImageUrl(raw: string | null | undefined): string | null {
  const u = (raw ?? '').trim();
  if (!u) {
    return null;
  }
  if (u.startsWith('https://') || u.startsWith('http://')) {
    return u;
  }
  if (u.startsWith('//')) {
    return `https:${u}`;
  }
  const base = (Deno.env.get('PUBLIC_SITE_URL') ?? BRAND.site).replace(/\/$/, '');
  if (u.startsWith('/')) {
    return `${base}${u}`;
  }
  return `${base}/${u}`;
}

function buildItemsHtml(lines: OrderLine[], currency: string): string {
  if (!lines.length) {
    return `<p style="margin:0 0 18px;font-size:14px;color:#666;font-family:Lato,Helvetica,Arial,sans-serif;">No items on this order.</p>`;
  }
  let rows = '';
  for (const line of lines) {
    const lineTotalCents = line.unit_price_cents * line.quantity;
    const imgUrl = absoluteImageUrl(line.image_url);
    const imgBlock = imgUrl
      ? `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(line.name)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid ${C.border};background:${C.white};" />`
      : `<div style="width:72px;height:72px;background:rgba(76,119,92,0.15);border-radius:8px;border:1px solid ${C.border};"></div>`;
    rows += `<tr>
      <td style="padding:12px 10px;vertical-align:middle;width:80px;">${imgBlock}</td>
      <td style="padding:12px 10px;vertical-align:middle;font-family:Lato,Helvetica,Arial,sans-serif;font-size:14px;color:#333;">
        <strong style="color:${C.shell};">${escapeHtml(line.name)}</strong><br/>
        <span style="color:#666;font-size:13px;">Qty ${line.quantity} × ${escapeHtml(formatMoney(line.unit_price_cents, currency))}</span>
      </td>
      <td align="right" style="padding:12px 10px;vertical-align:middle;white-space:nowrap;font-family:Lato,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${C.shell};">${escapeHtml(formatMoney(lineTotalCents, currency))}</td>
    </tr>`;
  }
  return `<div style="margin-bottom:20px;">
    <p style="margin:0 0 12px;font-size:15px;font-weight:600;color:${C.shell};font-family:Lato,Helvetica,Arial,sans-serif;">Your items</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${C.border};border-radius:10px;overflow:hidden;background:${C.white};">
      ${rows}
    </table>
  </div>`;
}

function metaCentsLabel(meta: Record<string, unknown> | null, key: string): string | null {
  if (!meta) {
    return null;
  }
  const v = meta[key];
  if (typeof v !== 'string' || !v.trim()) {
    return null;
  }
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  return formatMoney(n, 'USD');
}

function buildBreakdownHtml(
  meta: Record<string, unknown> | null,
  currency: string,
): string {
  const merch = metaCentsLabel(meta, 'merchandise_total_cents');
  const ship = metaCentsLabel(meta, 'shipping_cents');
  const tax = metaCentsLabel(meta, 'processing_tax_cents');
  if (!merch && !ship && !tax) {
    return '';
  }
  let inner = '';
  if (merch) {
    inner += `<tr><td style="padding:4px 0;font-family:Lato,Helvetica,Arial,sans-serif;font-size:13px;color:#555;">Merchandise</td><td align="right" style="padding:4px 0;">${escapeHtml(merch)}</td></tr>`;
  }
  if (ship) {
    inner += `<tr><td style="padding:4px 0;font-family:Lato,Helvetica,Arial,sans-serif;font-size:13px;color:#555;">Shipping</td><td align="right" style="padding:4px 0;">${escapeHtml(ship)}</td></tr>`;
  }
  if (tax) {
    inner += `<tr><td style="padding:4px 0;font-family:Lato,Helvetica,Arial,sans-serif;font-size:13px;color:#555;">Processing &amp; card fee</td><td align="right" style="padding:4px 0;">${escapeHtml(tax)}</td></tr>`;
  }
  return `<div style="margin-bottom:16px;padding:12px 14px;background:rgba(76,119,92,0.08);border-radius:8px;border:1px solid ${C.border};">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${C.shell};font-family:Lato,Helvetica,Arial,sans-serif;">Amount breakdown</p>
    <table width="100%" style="font-family:Lato,Helvetica,Arial,sans-serif;font-size:13px;color:${C.shell};">${inner}</table>
  </div>`;
}

function buildEmailHtml(params: {
  humanRef: string;
  customerName: string;
  reason: 'created' | 'status_updated';
  status: string;
  previousStatus?: string | null;
  totalLabel: string;
  introLine: string;
  currency: string;
  lines: OrderLine[];
  metadata: Record<string, unknown> | null;
}): string {
  const {
    humanRef,
    customerName,
    reason,
    status,
    previousStatus,
    totalLabel,
    introLine,
    currency,
    lines,
    metadata,
  } = params;
  const statusLabel = STATUS_EN[status] ?? status;
  const prevLabel =
    previousStatus && STATUS_EN[previousStatus]
      ? STATUS_EN[previousStatus]
      : previousStatus ?? '';

  const title =
    reason === 'created'
      ? 'Thank you for your order'
      : 'Your order was updated';

  const itemsHtml = buildItemsHtml(lines, currency);
  const breakdownHtml = buildBreakdownHtml(metadata, currency);

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${C.shell};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.shell};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:${C.band};border-radius:12px 12px 0 0;overflow:hidden;border:1px solid ${C.border};border-bottom:none;">
          <tr>
            <td style="padding:22px 28px;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;color:${C.accent};">${escapeHtml(BRAND.name)}</div>
              <div style="font-size:12px;color:${C.muted};margin-top:6px;">Handcrafted candles</div>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" style="max-width:600px;background:${C.white};border:1px solid ${C.border};border-top:none;border-radius:0 0 12px 12px;">
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:${C.shell};font-family:Lato,Helvetica,Arial,sans-serif;">${escapeHtml(title)}</h1>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3d3d;font-family:Lato,Helvetica,Arial,sans-serif;">Hi ${escapeHtml(customerName)},</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3d3d;font-family:Lato,Helvetica,Arial,sans-serif;">${escapeHtml(introLine)}</p>
              ${itemsHtml}
              ${breakdownHtml}
              <div style="background:rgba(76,119,92,0.12);border:1px solid ${C.border};border-radius:10px;padding:16px 18px;margin-bottom:18px;">
                <table width="100%" style="font-family:Lato,Helvetica,Arial,sans-serif;font-size:14px;color:${C.shell};">
                  <tr><td style="padding:4px 0;"><strong>Order number</strong></td><td align="right" style="font-family:monospace;">${escapeHtml(humanRef)}</td></tr>
                  <tr><td style="padding:4px 0;"><strong>Status</strong></td><td align="right" style="color:${C.sage};font-weight:600;">${escapeHtml(statusLabel)}</td></tr>
                  ${
                    reason === 'status_updated' && prevLabel
                      ? `<tr><td style="padding:4px 0;"><strong>Previous status</strong></td><td align="right">${escapeHtml(prevLabel)}</td></tr>`
                      : ''
                  }
                  <tr><td style="padding:8px 0 4px;"><strong>Order total</strong></td><td align="right" style="font-weight:700;color:${C.shell};">${escapeHtml(totalLabel)}</td></tr>
                </table>
              </div>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#666;font-family:Lato,Helvetica,Arial,sans-serif;">Questions? Reply to this email or write us at <a href="mailto:${escapeHtml(BRAND.email)}" style="color:${C.sage};font-weight:600;">${escapeHtml(BRAND.email)}</a>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <div style="height:1px;background:${C.border};opacity:0.5;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${C.band};font-family:Lato,Helvetica,Arial,sans-serif;">${escapeHtml(BRAND.name)}</p>
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.muted};font-family:Lato,Helvetica,Arial,sans-serif;">${escapeHtml(BRAND.address1)}<br/>${escapeHtml(BRAND.address2)}</p>
              <p style="margin:0 0 6px;font-size:12px;color:${C.muted};font-family:Lato,Helvetica,Arial,sans-serif;">${escapeHtml(BRAND.email)} · ${escapeHtml(BRAND.phones)}</p>
              <p style="margin:12px 0 0;font-size:11px;color:#999;font-family:Lato,Helvetica,Arial,sans-serif;">© ${new Date().getFullYear()} ${escapeHtml(BRAND.name)}. All rights reserved.</p>
              <p style="margin:8px 0 0;font-size:10px;color:#aaa;font-family:Lato,Helvetica,Arial,sans-serif;">This message is about your order. Do not send card numbers by email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`;
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

  let body: {
    order_id?: string;
    reason?: 'created' | 'status_updated';
    previous_status?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonResponse({ok: false, error: 'invalid_json'}, 400);
  }

  const orderId = String(body.order_id ?? '').trim();
  const reason = body.reason === 'status_updated' ? 'status_updated' : 'created';
  const previousStatus =
    typeof body.previous_status === 'string' ? body.previous_status : null;

  if (!orderId) {
    return jsonResponse({ok: false, error: 'order_id_required'}, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {headers: {Authorization: authHeader}},
  });
  const {data: userData, error: userErr} = await userClient.auth.getUser();
  if (userErr || !userData.user?.id) {
    return jsonResponse({ok: false, error: 'unauthorized'}, 401);
  }
  const uid = userData.user.id;

  const {data: isAdminRpc, error: rpcErr} = await userClient.rpc('is_admin');
  const isAdmin = Boolean(isAdminRpc) && !rpcErr;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: {persistSession: false, autoRefreshToken: false},
  });

  const {data: order, error: orderErr} = await admin
    .from('orders')
    .select(
      'id, user_id, status, total_cents, currency, human_order_number, payment_method, created_at, metadata',
    )
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr || !order) {
    return jsonResponse({ok: false, error: 'order_not_found'}, 404);
  }

  const row = order as {
    user_id: string | null;
    status: string;
    total_cents: number;
    currency: string;
    human_order_number: string | null;
    metadata: Record<string, unknown> | null;
  };

  if (reason === 'created') {
    if (row.user_id !== uid) {
      return jsonResponse({ok: false, error: 'forbidden'}, 403);
    }
  } else {
    if (!isAdmin) {
      return jsonResponse({ok: false, error: 'forbidden'}, 403);
    }
  }

  const {data: itemsRows, error: itemsErr} = await admin
    .from('order_items')
    .select('name, quantity, unit_price_cents, image_url')
    .eq('order_id', orderId)
    .order('created_at', {ascending: true});

  if (itemsErr) {
    console.warn('order_items', itemsErr.message);
  }

  const lines: OrderLine[] = (itemsRows ?? []).map((r) => ({
    name: String((r as {name?: string}).name ?? 'Item'),
    quantity: Math.max(1, Number((r as {quantity?: number}).quantity) || 1),
    unit_price_cents: Math.max(
      0,
      Math.round(Number((r as {unit_price_cents?: number}).unit_price_cents) || 0),
    ),
    image_url:
      typeof (r as {image_url?: string | null}).image_url === 'string'
        ? (r as {image_url: string | null}).image_url
        : null,
  }));

  const {data: prof} = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', row.user_id ?? '')
    .maybeSingle();

  const profile = prof as {email: string | null; full_name: string | null} | null;

  let toEmail = (profile?.email ?? '').trim();
  if (!toEmail && row.user_id) {
    const {data: authUser} = await admin.auth.admin.getUserById(row.user_id);
    toEmail = (authUser.user?.email ?? '').trim();
  }

  if (!toEmail) {
    return jsonResponse({ok: false, error: 'customer_email_missing'}, 422);
  }

  const humanRef =
    (row.human_order_number ?? '').trim() || row.id.slice(0, 8).toUpperCase();
  const customerName =
    (profile?.full_name ?? '').trim() || toEmail.split('@')[0] || 'customer';

  const currency = row.currency || 'USD';
  const totalLabel = formatMoney(row.total_cents, currency);

  const introLine =
    reason === 'created'
      ? 'We have received your order. Here is what you purchased:'
      : 'Your order status has changed. Here is the latest information:';

  const meta =
    row.metadata && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, unknown>)
      : null;

  const html = buildEmailHtml({
    humanRef,
    customerName,
    reason,
    status: row.status,
    previousStatus: reason === 'status_updated' ? previousStatus : null,
    totalLabel,
    introLine,
    currency,
    lines,
    metadata: meta,
  });

  const from =
    Deno.env.get('ORDER_EMAIL_FROM')?.trim() ||
    `Candle Laine <onboarding@resend.dev>`;

  const subject =
    reason === 'created'
      ? `${BRAND.name} · Order ${humanRef} confirmed`
      : `${BRAND.name} · Order ${humanRef} — ${STATUS_EN[row.status] ?? row.status}`;

  if (!resendKey) {
    console.warn('order-email-notify: RESEND_API_KEY not set; skip send');
    return jsonResponse({ok: true, skipped: true, reason: 'no_resend'});
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Resend error', res.status, errText);
    return jsonResponse(
      {ok: false, error: 'resend_failed', detail: errText.slice(0, 200)},
      502,
    );
  }

  return jsonResponse({ok: true, sent: true});
});
