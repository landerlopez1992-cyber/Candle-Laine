import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import {
  ORDER_STATUS_OPTIONS,
  orderStatusOptionsForAdmin,
  type AdminOrderItemRow,
  type OrderRow,
  type OrderStatus,
} from '../../types/shop';
import type {UserAddressRow} from '../../types/address';
import {formatAddressLine} from '../../utils/formatAddressLine';
import {notifyOrderEmail} from '../../utils/orderEmailNotify';

const tableShell: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  color: '#1C2D18',
};

const thTd: React.CSSProperties = {
  borderBottom: `1px solid ${APP_PALETTE.border}`,
  padding: '12px 14px',
  textAlign: 'left',
};

const selectBaseStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: '#1C2D18',
  minWidth: 180,
  cursor: 'pointer',
};

function statusSelectStyle(status: OrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {...selectBaseStyle};
  switch (status) {
    case 'pending_payment':
      return {
        ...base,
        backgroundColor: 'rgba(241, 185, 127, 0.35)',
        borderColor: APP_PALETTE.accent,
      };
    case 'created':
      return {
        ...base,
        backgroundColor: 'rgba(76, 119, 92, 0.22)',
        borderColor: '#4C775C',
      };
    case 'paid':
      return {
        ...base,
        backgroundColor: 'rgba(84, 89, 83, 0.2)',
        borderColor: APP_PALETTE.border,
      };
    case 'processing':
      return {
        ...base,
        backgroundColor: 'rgba(241, 185, 127, 0.2)',
        borderColor: APP_PALETTE.accent,
      };
    case 'shipped':
      return {
        ...base,
        backgroundColor: 'rgba(76, 119, 92, 0.32)',
        borderColor: '#4C775C',
      };
    case 'cancelled':
      return {
        ...base,
        backgroundColor: 'rgba(180, 60, 60, 0.15)',
        borderColor: 'rgba(160, 50, 50, 0.6)',
      };
    default:
      return {
        ...base,
        backgroundColor: APP_PALETTE.imageWell,
      };
  }
}

function metaString(
  m: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!m || typeof m !== 'object') {
    return undefined;
  }
  const v = (m as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : undefined;
}

function paymentMethodLabel(
  method: string | null,
  metadata?: Record<string, unknown> | null,
): string {
  const fromMeta = metaString(metadata ?? null, 'payment_method_display')?.trim();
  if (fromMeta) {
    return fromMeta;
  }
  if (!method) {
    return '—';
  }
  if (method === 'zelle') {
    return 'Zelle';
  }
  if (method === 'card') {
    return 'Tarjeta';
  }
  if (method === 'installments') {
    return 'Cuotas';
  }
  if (method === 'installments_klarna') {
    return 'Klarna';
  }
  if (method === 'installments_affirm') {
    return 'Affirm';
  }
  return method;
}

function splitFirstLast(fullName: string | null | undefined): {first: string; last: string} {
  const t = (fullName ?? '').trim();
  if (!t) {
    return {first: '—', last: '—'};
  }
  const parts = t.split(/\s+/);
  if (parts.length === 1) {
    return {first: parts[0]!, last: '—'};
  }
  return {first: parts[0]!, last: parts.slice(1).join(' ')};
}

function formatMetaCents(centsStr: string | undefined): string {
  if (centsStr == null || centsStr === '') {
    return '—';
  }
  const n = parseInt(String(centsStr), 10);
  if (!Number.isFinite(n)) {
    return '—';
  }
  return (n / 100).toFixed(2);
}

function statusLabel(status: OrderStatus): string {
  return (
    ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
  );
}

export const AdminOrdersPanel: React.FC = () => {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shopOrigin, setShopOrigin] = useState<{
    ship_from_zip: string;
    ship_from_state: string;
    ship_from_country: string;
  } | null>(null);
  const [shopZellePhone, setShopZellePhone] = useState<string | null>(null);
  const [detailShippingAddress, setDetailShippingAddress] =
    useState<UserAddressRow | null>(null);
  const [detailAddressLoading, setDetailAddressLoading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qError} = await supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        status,
        total_cents,
        currency,
        human_order_number,
        payment_method,
        metadata,
        created_at,
        updated_at,
        order_items (
          id,
          name,
          quantity,
          unit_price_cents,
          image_url
        ),
        profiles (
          email,
          full_name,
          phone
        )
      `,
      )
      .order('created_at', {ascending: false});

    setLoading(false);
    if (qError) {
      setError(qError.message);
      setRows([]);
      return;
    }

    const raw = (data ?? []) as Record<string, unknown>[];
    const list: OrderRow[] = raw.map((row) => {
      let prof = row.profiles as OrderRow['profiles'];
      if (Array.isArray(prof)) {
        prof = (prof[0] as OrderRow['profiles']) ?? null;
      }
      let items = row.order_items as AdminOrderItemRow[] | null;
      if (!Array.isArray(items)) {
        items = items ? [items as AdminOrderItemRow] : [];
      }
      return {
        ...row,
        profiles: prof,
        order_items: items,
        metadata: (row.metadata as OrderRow['metadata']) ?? null,
      } as OrderRow;
    });
    setRows(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const [{data: ff}, {data: pay}] = await Promise.all([
        supabase
          .from('shop_fulfillment')
          .select('ship_from_zip, ship_from_state, ship_from_country')
          .eq('id', 'default')
          .maybeSingle(),
        supabase.from('shop_payment_settings').select('zelle_phone').eq('id', 'default').maybeSingle(),
      ]);
      if (cancelled) {
        return;
      }
      if (ff && typeof ff === 'object') {
        const r = ff as {
          ship_from_zip?: string;
          ship_from_state?: string;
          ship_from_country?: string;
        };
        setShopOrigin({
          ship_from_zip: String(r.ship_from_zip ?? '').trim() || '—',
          ship_from_state: String(r.ship_from_state ?? '').trim() || '—',
          ship_from_country: String(r.ship_from_country ?? '').trim() || '—',
        });
      }
      const zp = (pay as {zelle_phone?: string} | null)?.zelle_phone;
      setShopZellePhone(typeof zp === 'string' && zp.trim() ? zp.trim() : null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !expandedId) {
      setDetailShippingAddress(null);
      setDetailAddressLoading(false);
      return;
    }
    const o = rows.find((r) => r.id === expandedId);
    const aid = metaString(o?.metadata ?? null, 'shipping_address_id')?.trim();
    if (!aid) {
      setDetailShippingAddress(null);
      setDetailAddressLoading(false);
      return;
    }
    let cancelled = false;
    setDetailAddressLoading(true);
    void (async () => {
      const {data} = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', aid)
        .maybeSingle();
      if (cancelled) {
        return;
      }
      setDetailShippingAddress((data as UserAddressRow) ?? null);
      setDetailAddressLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [expandedId, rows]);

  const onStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!supabase) {
      return;
    }
    const previousStatus = rows.find((o) => o.id === orderId)?.status;
    setUpdatingId(orderId);
    const {error: uError} = await supabase
      .from('orders')
      .update({status})
      .eq('id', orderId);
    setUpdatingId(null);
    if (uError) {
      setError(uError.message);
      return;
    }
    setRows((prev) =>
      prev.map((o) => (o.id === orderId ? {...o, status} : o)),
    );
    if (previousStatus !== status) {
      void notifyOrderEmail({
        orderId,
        reason: 'status_updated',
        previousStatus: previousStatus ?? null,
      });
    }
  };

  const onAcceptZellePayment = async (orderId: string) => {
    await onStatusChange(orderId, 'created');
  };

  const formatMoney = (cents: number, currency: string) => {
    const v = (cents / 100).toFixed(2);
    return `${currency} ${v}`;
  };

  const formatLineMoney = (cents: number) => (cents / 100).toFixed(2);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{width: '100%'}}>
      <h1
        style={{
          margin: 0,
          marginBottom: 12,
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 28,
          fontWeight: 600,
          color: APP_PALETTE.textOnDark,
        }}
      >
        Órdenes
      </h1>
      <p
        className='t18'
        style={{
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.55,
          color: APP_PALETTE.textMuted,
        }}
      >
        Aquí ves todos los pedidos. Los pagos con Zelle empiezan en{' '}
        <strong style={{color: APP_PALETTE.textOnDark}}>
          Pendiente de pago
        </strong>
        . Cuando confirmes en el banco que entró el Zelle, elige{' '}
        <strong style={{color: APP_PALETTE.textOnDark}}>Orden creada</strong>{' '}
        en el desplegable o usa «Confirmar Zelle» en el detalle: eso indica al
        cliente que el pago se recibió y la orden quedó creada; luego sigues con
        procesándose → enviada.
      </p>

      {loading && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          Cargando…
        </p>
      )}
      {error && (
        <p
          className='t16'
          style={{color: APP_PALETTE.accent, marginBottom: 16}}
        >
          {error}
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          No hay pedidos todavía. Cuando el checkout guarde filas en{' '}
          <code>orders</code>, las verás aquí.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.imageWell,
          }}
        >
          <table style={tableShell}>
            <thead>
              <tr style={{backgroundColor: 'rgba(76, 119, 92, 0.12)'}}>
                <th style={thTd}>Cliente</th>
                <th style={thTd}>Nº</th>
                <th style={thTd}>Pago</th>
                <th style={thTd}>Total</th>
                <th style={thTd}>Estado</th>
                <th style={thTd}>Creada</th>
                <th style={thTd}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const profile = o.profiles;
                const label =
                  profile?.full_name?.trim() ||
                  profile?.email ||
                  o.user_id ||
                  '—';
                const isPendingZelle =
                  o.status === 'pending_payment' &&
                  o.payment_method === 'zelle';
                const rowBg =
                  o.status === 'pending_payment'
                    ? 'rgba(241, 185, 127, 0.18)'
                    : undefined;
                const humanRef =
                  o.human_order_number?.trim() || o.id.slice(0, 8).toUpperCase();
                const items = o.order_items ?? [];

                return (
                  <React.Fragment key={o.id}>
                    <tr style={{backgroundColor: rowBg}}>
                      <td style={thTd}>
                        <div>{label}</div>
                        {profile?.email && (
                          <div
                            style={{
                              fontSize: 12,
                              opacity: 0.65,
                              marginTop: 4,
                            }}
                          >
                            {profile.email}
                          </div>
                        )}
                      </td>
                      <td style={thTd}>
                        <span style={{fontFamily: 'monospace', fontSize: 13}}>
                          {humanRef}
                        </span>
                      </td>
                      <td style={thTd}>
                        {paymentMethodLabel(o.payment_method, o.metadata)}
                        {isPendingZelle && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#8B5A2B',
                              marginTop: 4,
                            }}
                          >
                            Pendiente de pago (Zelle)
                          </div>
                        )}
                      </td>
                      <td style={thTd}>
                        {formatMoney(o.total_cents, o.currency)}
                      </td>
                      <td style={thTd}>
                        <select
                          aria-label='Estado del pedido'
                          value={o.status}
                          disabled={updatingId === o.id}
                          style={statusSelectStyle(o.status)}
                          onChange={(e) =>
                            void onStatusChange(
                              o.id,
                              e.target.value as OrderStatus,
                            )
                          }
                        >
                          {orderStatusOptionsForAdmin(o.status).map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={thTd}>
                        {o.created_at
                          ? new Date(o.created_at).toLocaleString('es-ES')
                          : '—'}
                      </td>
                      <td style={thTd}>
                        <button
                          type='button'
                          className='clickable'
                          onClick={() => toggleExpanded(o.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1px solid ${APP_PALETTE.border}`,
                            background: APP_PALETTE.imageWell,
                            color: '#1C2D18',
                            fontFamily: 'Lato, sans-serif',
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {expandedId === o.id ? 'Cerrar' : 'Abrir'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            ...thTd,
                            backgroundColor: 'rgba(76, 119, 92, 0.06)',
                            verticalAlign: 'top',
                          }}
                        >
                          {(() => {
                            const meta = o.metadata ?? null;
                            const receiver = splitFirstLast(profile?.full_name);
                            const shipLine =
                              metaString(meta, 'shipping_address_line')?.trim() ||
                              '';
                            const addrStructured =
                              detailAddressLoading
                                ? 'Cargando dirección…'
                                : detailShippingAddress
                                  ? formatAddressLine(detailShippingAddress)
                                  : shipLine || '—';
                            const originLine = shopOrigin
                              ? `${shopOrigin.ship_from_zip}, ${shopOrigin.ship_from_state}, ${shopOrigin.ship_from_country}`
                              : '—';
                            return (
                              <>
                                <div
                                  style={{
                                    fontSize: 13,
                                    marginBottom: 14,
                                    color: '#1C2D18',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  <div style={{marginBottom: 6}}>
                                    <strong>Nº pedido:</strong> {humanRef}
                                  </div>
                                  <div style={{marginBottom: 6}}>
                                    <strong>ID interno:</strong>{' '}
                                    <span style={{fontFamily: 'monospace', fontSize: 12}}>
                                      {o.id}
                                    </span>
                                  </div>
                                  <div style={{marginBottom: 6}}>
                                    <strong>Estado:</strong> {statusLabel(o.status)}
                                  </div>
                                  <div style={{marginBottom: 6}}>
                                    <strong>Método de pago:</strong>{' '}
                                    {paymentMethodLabel(o.payment_method, o.metadata)}
                                  </div>
                                  <div style={{marginBottom: 6}}>
                                    <strong>Total cobrado:</strong>{' '}
                                    {formatMoney(o.total_cents, o.currency)}
                                  </div>
                                  <div>
                                    <strong>Creada:</strong>{' '}
                                    {o.created_at
                                      ? new Date(o.created_at).toLocaleString('es-ES')
                                      : '—'}
                                    {' · '}
                                    <strong>Actualizada:</strong>{' '}
                                    {o.updated_at
                                      ? new Date(o.updated_at).toLocaleString('es-ES')
                                      : '—'}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                      'repeat(auto-fit, minmax(260px, 1fr))',
                                    gap: 16,
                                    marginBottom: 16,
                                  }}
                                >
                                  <div
                                    style={{
                                      border: `1px solid ${APP_PALETTE.border}`,
                                      borderRadius: 10,
                                      padding: 12,
                                      backgroundColor: APP_PALETTE.imageWell,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        marginBottom: 8,
                                        color: '#1C2D18',
                                      }}
                                    >
                                      Emisor (tienda)
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Nombre comercial:</strong> Candle Laine
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Teléfono contacto:</strong>{' '}
                                      {shopZellePhone ?? '—'}
                                    </div>
                                    <div className='t14' style={{marginBottom: 0}}>
                                      <strong>Origen de envío:</strong> {originLine}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      border: `1px solid ${APP_PALETTE.border}`,
                                      borderRadius: 10,
                                      padding: 12,
                                      backgroundColor: APP_PALETTE.imageWell,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: 700,
                                        marginBottom: 8,
                                        color: '#1C2D18',
                                      }}
                                    >
                                      Receptor (cliente)
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Nombre:</strong> {receiver.first}
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Apellidos:</strong> {receiver.last}
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Email:</strong> {profile?.email ?? '—'}
                                    </div>
                                    <div className='t14' style={{marginBottom: 6}}>
                                      <strong>Teléfono:</strong>{' '}
                                      {profile?.phone?.trim() || '—'}
                                    </div>
                                    <div className='t14' style={{marginBottom: 0}}>
                                      <strong>Dirección de envío:</strong> {addrStructured}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    color: '#1C2D18',
                                  }}
                                >
                                  Productos
                                </div>
                                {items.length === 0 ? (
                                  <p
                                    className='t14'
                                    style={{margin: '0 0 16px 0', color: APP_PALETTE.priceMuted}}
                                  >
                                    Sin líneas de artículo.
                                  </p>
                                ) : (
                                  <table
                                    style={{
                                      width: '100%',
                                      borderCollapse: 'collapse',
                                      marginBottom: 16,
                                      fontSize: 13,
                                    }}
                                  >
                                    <thead>
                                      <tr style={{borderBottom: `1px solid ${APP_PALETTE.border}`}}>
                                        <th style={{textAlign: 'left', padding: '6px 8px'}}>
                                          Artículo
                                        </th>
                                        <th style={{textAlign: 'right', padding: '6px 8px'}}>
                                          Cant.
                                        </th>
                                        <th style={{textAlign: 'right', padding: '6px 8px'}}>
                                          P. unit.
                                        </th>
                                        <th style={{textAlign: 'right', padding: '6px 8px'}}>
                                          Subtotal línea
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {items.map((line) => {
                                        const lineTotalCents =
                                          line.unit_price_cents * line.quantity;
                                        return (
                                          <tr
                                            key={line.id}
                                            style={{
                                              borderBottom: `1px solid rgba(84, 89, 83, 0.25)`,
                                            }}
                                          >
                                            <td style={{padding: '8px', verticalAlign: 'middle'}}>
                                              <div
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 10,
                                                }}
                                              >
                                                {line.image_url ? (
                                                  <img
                                                    src={line.image_url}
                                                    alt=''
                                                    style={{
                                                      width: 40,
                                                      height: 40,
                                                      objectFit: 'cover',
                                                      borderRadius: 6,
                                                      border: `1px solid ${APP_PALETTE.border}`,
                                                    }}
                                                  />
                                                ) : null}
                                                <span>{line.name}</span>
                                              </div>
                                            </td>
                                            <td
                                              style={{
                                                padding: '8px',
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              {line.quantity}
                                            </td>
                                            <td
                                              style={{
                                                padding: '8px',
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              USD {formatLineMoney(line.unit_price_cents)}
                                            </td>
                                            <td
                                              style={{
                                                padding: '8px',
                                                textAlign: 'right',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              USD {formatLineMoney(lineTotalCents)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}

                                <div
                                  style={{
                                    border: `1px solid ${APP_PALETTE.border}`,
                                    borderRadius: 10,
                                    padding: 12,
                                    backgroundColor: 'rgba(76, 119, 92, 0.08)',
                                    marginBottom: 16,
                                    fontSize: 13,
                                  }}
                                >
                                  <div style={{fontWeight: 700, marginBottom: 8}}>
                                    Desglose de importes (checkout)
                                  </div>
                                  <div className='t14' style={{marginBottom: 4}}>
                                    <strong>Mercancía:</strong> USD{' '}
                                    {formatMetaCents(
                                      metaString(meta, 'merchandise_total_cents'),
                                    )}
                                  </div>
                                  <div className='t14' style={{marginBottom: 4}}>
                                    <strong>Envío:</strong> USD{' '}
                                    {formatMetaCents(metaString(meta, 'shipping_cents'))}
                                  </div>
                                  <div className='t14' style={{marginBottom: 4}}>
                                    <strong>Procesamiento (Tax):</strong> USD{' '}
                                    {formatMetaCents(
                                      metaString(meta, 'processing_tax_cents'),
                                    )}
                                  </div>
                                  <div className='t14' style={{marginBottom: 0}}>
                                    <strong>Total cobrado:</strong>{' '}
                                    {formatMoney(o.total_cents, o.currency)}
                                  </div>
                                  {metaString(meta, 'stripe_payment_intent_id') ? (
                                    <div
                                      className='t14'
                                      style={{
                                        marginTop: 10,
                                        wordBreak: 'break-all',
                                        opacity: 0.85,
                                      }}
                                    >
                                      <strong>Stripe PI:</strong>{' '}
                                      {metaString(meta, 'stripe_payment_intent_id')}
                                    </div>
                                  ) : null}
                                  {metaString(meta, 'stripe_charge_id') ? (
                                    <div
                                      className='t14'
                                      style={{
                                        marginTop: 4,
                                        wordBreak: 'break-all',
                                        opacity: 0.85,
                                      }}
                                    >
                                      <strong>Stripe charge:</strong>{' '}
                                      {metaString(meta, 'stripe_charge_id')}
                                    </div>
                                  ) : null}
                                </div>
                              </>
                            );
                          })()}
                          {o.status === 'pending_payment' &&
                            o.payment_method === 'zelle' && (
                              <div>
                                <p
                                  className='t14'
                                  style={{
                                    margin: '0 0 10px 0',
                                    color: '#5C4033',
                                  }}
                                >
                                  Confirma en tu banco que recibiste el Zelle y
                                  pulsa para pasar la orden a «Orden creada»
                                  (pago recibido y pedido confirmado).
                                </p>
                                <button
                                  type='button'
                                  className='clickable'
                                  disabled={updatingId === o.id}
                                  onClick={() =>
                                    void onAcceptZellePayment(o.id)
                                  }
                                  style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: `1px solid ${APP_PALETTE.accent}`,
                                    background: APP_PALETTE.accent,
                                    color: '#1C2D18',
                                    fontFamily: 'Lato, sans-serif',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor:
                                      updatingId === o.id
                                        ? 'wait'
                                        : 'pointer',
                                    opacity: updatingId === o.id ? 0.7 : 1,
                                  }}
                                >
                                  {updatingId === o.id
                                    ? 'Guardando…'
                                    : 'Confirmar Zelle (orden creada)'}
                                </button>
                              </div>
                            )}
                          {o.status === 'pending_payment' &&
                            o.payment_method !== 'zelle' && (
                              <p
                                className='t14'
                                style={{margin: 0, color: APP_PALETTE.priceMuted}}
                              >
                                Pendiente de pago: usa el desplegable o confirma
                                el cobro según tu flujo.
                              </p>
                            )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type='button'
        className='clickable'
        onClick={() => void load()}
        style={{
          marginTop: 20,
          padding: '10px 18px',
          borderRadius: 8,
          border: `1px solid ${APP_PALETTE.accent}`,
          background: 'transparent',
          color: APP_PALETTE.accent,
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Actualizar lista
      </button>
    </div>
  );
};
