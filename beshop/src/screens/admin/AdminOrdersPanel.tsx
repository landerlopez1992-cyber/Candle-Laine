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

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: '#1C2D18',
  backgroundColor: APP_PALETTE.imageWell,
  minWidth: 180,
  cursor: 'pointer',
};

function paymentMethodLabel(method: string | null): string {
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
  return method;
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
        created_at,
        updated_at,
        order_items (
          id,
          name,
          quantity,
          unit_price_cents
        ),
        profiles (
          email,
          full_name
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
      } as OrderRow;
    });
    setRows(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!supabase) {
      return;
    }
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
                        {paymentMethodLabel(o.payment_method)}
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
                          style={selectStyle}
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
                          <div
                            style={{
                              fontSize: 13,
                              marginBottom: 12,
                              color: '#1C2D18',
                            }}
                          >
                            <strong>Pedido:</strong> {humanRef} ·{' '}
                            <strong>Estado:</strong> {statusLabel(o.status)}
                          </div>
                          {items.length === 0 ? (
                            <p
                              className='t14'
                              style={{margin: 0, color: APP_PALETTE.priceMuted}}
                            >
                              Sin líneas de artículo.
                            </p>
                          ) : (
                            <ul
                              style={{
                                margin: '0 0 16px 0',
                                paddingLeft: 18,
                              }}
                            >
                              {items.map((line) => (
                                <li
                                  key={line.id}
                                  style={{marginBottom: 6}}
                                >
                                  {line.name} × {line.quantity} — USD{' '}
                                  {formatLineMoney(line.unit_price_cents)} / u.
                                </li>
                              ))}
                            </ul>
                          )}
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
