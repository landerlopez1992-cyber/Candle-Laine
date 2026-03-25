import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {OrderStatus, ProfileRow} from '../../types/shop';
import {ORDER_STATUS_OPTIONS} from '../../types/shop';
import type {UserAddressRow} from '../../types/address';
import {formatAddressLine} from '../../utils/formatAddressLine';

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
const thTdCompact: React.CSSProperties = {
  ...thTd,
  padding: '12px 8px',
};

function labelForOrderStatus(status: OrderStatus): string {
  const o = ORDER_STATUS_OPTIONS.find((x) => x.value === status);
  return o?.label ?? status;
}

function getInitialLetter(name: string | null | undefined, email: string | null | undefined): string {
  const n = (name ?? '').trim();
  if (n.length > 0) {
    return n.charAt(0).toUpperCase();
  }
  const e = (email ?? '').trim();
  if (e.length > 0) {
    return e.charAt(0).toUpperCase();
  }
  return '?';
}

type OrderRowLite = {
  id: string;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  created_at: string;
  human_order_number: string | null;
};

type DetailState = {
  addresses: UserAddressRow[];
  orders: OrderRowLite[];
  ordersTotalCents: number;
  ordersCurrency: string;
  ordersCount: number;
  loading: boolean;
  error: string | null;
};

const emptyDetail: DetailState = {
  addresses: [],
  orders: [],
  ordersTotalCents: 0,
  ordersCurrency: 'USD',
  ordersCount: 0,
  loading: false,
  error: null,
};

export const AdminUsersPanel: React.FC = () => {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>(emptyDetail);
  const [blockBusyId, setBlockBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qError} = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, created_at, avatar_url, phone, location, is_blocked',
      )
      .order('created_at', {ascending: false});

    setLoading(false);
    if (qError) {
      setError(qError.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as ProfileRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const detailProfile = useMemo(() => {
    if (!detailUserId) {
      return null;
    }
    return rows.find((r) => r.id === detailUserId) ?? null;
  }, [detailUserId, rows]);

  useEffect(() => {
    if (!detailUserId || !supabase) {
      setDetail(emptyDetail);
      return;
    }
    let cancelled = false;
    setDetail((d) => ({...d, loading: true, error: null}));

    void (async () => {
      const [addrRes, ordRes, countRes, sumRes] = await Promise.all([
        supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', detailUserId)
          .order('updated_at', {ascending: false}),
        supabase
          .from('orders')
          .select('id, status, total_cents, currency, created_at, human_order_number')
          .eq('user_id', detailUserId)
          .order('created_at', {ascending: false})
          .limit(100),
        supabase
          .from('orders')
          .select('id', {count: 'exact', head: true})
          .eq('user_id', detailUserId),
        supabase.from('orders').select('total_cents').eq('user_id', detailUserId),
      ]);

      if (cancelled) {
        return;
      }

      if (addrRes.error) {
        setDetail({
          ...emptyDetail,
          loading: false,
          error: addrRes.error.message,
        });
        return;
      }
      if (ordRes.error) {
        setDetail({
          ...emptyDetail,
          loading: false,
          error: ordRes.error.message,
        });
        return;
      }
      if (countRes.error) {
        setDetail({
          ...emptyDetail,
          loading: false,
          error: countRes.error.message,
        });
        return;
      }
      if (sumRes.error) {
        setDetail({
          ...emptyDetail,
          loading: false,
          error: sumRes.error.message,
        });
        return;
      }

      const orders = (ordRes.data ?? []) as OrderRowLite[];
      const ordersCount = countRes.count ?? orders.length;
      const centsRows = (sumRes.data ?? []) as {total_cents: number}[];
      const ordersTotalCents = centsRows.reduce(
        (s, o) => s + (o.total_cents ?? 0),
        0,
      );
      const ordersCurrency = orders[0]?.currency ?? 'USD';

      setDetail({
        addresses: (addrRes.data ?? []) as UserAddressRow[],
        orders,
        ordersTotalCents,
        ordersCurrency,
        ordersCount,
        loading: false,
        error: null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [detailUserId]);

  const closeDetail = useCallback(() => {
    setDetailUserId(null);
    setDetail(emptyDetail);
  }, []);

  const toggleBlock = useCallback(
    async (row: ProfileRow) => {
      if (!supabase) {
        return;
      }
      const next = !row.is_blocked;
      const ok = window.confirm(
        next
          ? '¿Bloquear esta cuenta? El usuario no podrá usar la tienda hasta contactar con la empresa.'
          : '¿Desbloquear esta cuenta?',
      );
      if (!ok) {
        return;
      }
      setBlockBusyId(row.id);
      const {error: uErr} = await supabase
        .from('profiles')
        .update({is_blocked: next})
        .eq('id', row.id);
      setBlockBusyId(null);
      if (uErr) {
        window.alert(uErr.message);
        return;
      }
      setRows((prev) =>
        prev.map((p) => (p.id === row.id ? {...p, is_blocked: next} : p)),
      );
    },
    [],
  );

  const money = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
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
        Usuarios
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
        Usuarios registrados en la app (tabla{' '}
        <code style={{fontSize: 13}}>profiles</code>, sincronizada con Auth).
        Cada alta nueva aparece aquí automáticamente.
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
          No hay usuarios en <code>profiles</code>. Ejecuta la migración SQL en
          Supabase y vuelve a cargar.
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
                <th style={thTdCompact}>Foto</th>
                <th style={thTd}>Email</th>
                <th style={thTd}>Nombre</th>
                <th style={thTd}>Alta</th>
                <th style={thTd}>ID</th>
                <th style={thTdCompact}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const avatarSrc = r.avatar_url?.trim();
                const letter = getInitialLetter(r.full_name, r.email);
                const busy = blockBusyId === r.id;
                return (
                  <tr key={r.id}>
                    <td style={thTdCompact}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: `1px solid ${APP_PALETTE.border}`,
                          backgroundColor: 'rgba(76, 119, 92, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt=''
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 600,
                              color: '#1C2D18',
                            }}
                          >
                            {letter}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={thTd}>{r.email ?? '—'}</td>
                    <td style={thTd}>{r.full_name?.trim() || '—'}</td>
                    <td style={thTd}>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString('es-ES')
                        : '—'}
                    </td>
                    <td
                      style={{
                        ...thTd,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        maxWidth: 200,
                        wordBreak: 'break-all',
                      }}
                    >
                      {r.id}
                    </td>
                    <td style={{...thTdCompact, whiteSpace: 'nowrap'}}>
                      <button
                        type='button'
                        className='clickable'
                        disabled={busy}
                        onClick={() => {
                          setDetail({...emptyDetail, loading: true});
                          setDetailUserId(r.id);
                        }}
                        style={{
                          marginRight: 8,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${APP_PALETTE.accent}`,
                          background: 'transparent',
                          color: APP_PALETTE.accent,
                          fontFamily: 'Lato, sans-serif',
                          fontSize: 13,
                          cursor: busy ? 'wait' : 'pointer',
                        }}
                      >
                        Ver
                      </button>
                      <button
                        type='button'
                        className='clickable'
                        disabled={busy}
                        onClick={() => void toggleBlock(r)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${r.is_blocked ? APP_PALETTE.border : APP_PALETTE.accent}`,
                          background: r.is_blocked
                            ? 'rgba(76, 119, 92, 0.2)'
                            : 'transparent',
                          color: r.is_blocked ? APP_PALETTE.textOnDark : APP_PALETTE.accent,
                          fontFamily: 'Lato, sans-serif',
                          fontSize: 13,
                          cursor: busy ? 'wait' : 'pointer',
                        }}
                      >
                        {busy ? '…' : r.is_blocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </td>
                  </tr>
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

      {detailUserId && detailProfile && (
        <div
          role='dialog'
          aria-modal='true'
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: APP_PALETTE.imageWell,
              borderRadius: 12,
              border: `1px solid ${APP_PALETTE.border}`,
              padding: '20px 18px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'League Spartan, sans-serif',
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#1C2D18',
                }}
              >
                Cliente
              </h2>
              <button
                type='button'
                className='clickable'
                onClick={closeDetail}
                style={{
                  margin: 0,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${APP_PALETTE.border}`,
                  background: 'transparent',
                  color: '#1C2D18',
                  cursor: 'pointer',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                }}
              >
                Cerrar
              </button>
            </div>

            <div style={{display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center'}}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `1px solid ${APP_PALETTE.border}`,
                  backgroundColor: 'rgba(76, 119, 92, 0.15)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {detailProfile.avatar_url?.trim() ? (
                  <img
                    src={detailProfile.avatar_url.trim()}
                    alt=''
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : (
                  <span style={{fontSize: 28, fontWeight: 600, color: '#1C2D18'}}>
                    {getInitialLetter(detailProfile.full_name, detailProfile.email)}
                  </span>
                )}
              </div>
              <div>
                <p className='t16' style={{margin: '0 0 4px', fontWeight: 600, color: '#1C2D18'}}>
                  {detailProfile.full_name?.trim() || '—'}
                </p>
                <p className='t14' style={{margin: 0, color: '#3D3D3D',
                  wordBreak: 'break-all'}}>
                  {detailProfile.email ?? '—'}
                </p>
                {detailProfile.is_blocked ? (
                  <p className='t14' style={{margin: '8px 0 0', color: APP_PALETTE.accent}}>
                    Cuenta bloqueada
                  </p>
                ) : null}
              </div>
            </div>

            <section style={{marginBottom: 18}}>
              <h3
                className='t14'
                style={{
                  margin: '0 0 8px',
                  fontWeight: 600,
                  color: '#1C2D18',
                }}
              >
                Datos personales
              </h3>
              <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                Teléfono: {detailProfile.phone?.trim() || '—'}
              </p>
              <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                País (perfil): {detailProfile.location?.trim() || '—'}
              </p>
              <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                Alta de cuenta:{' '}
                {detailProfile.created_at
                  ? new Date(detailProfile.created_at).toLocaleString('es-ES')
                  : '—'}
              </p>
              <p className='t14' style={{margin: '4px 0', color: '#3D3D3D', wordBreak: 'break-all'}}>
                ID: {detailProfile.id}
              </p>
            </section>

            <section style={{marginBottom: 18}}>
              <h3
                className='t14'
                style={{
                  margin: '0 0 8px',
                  fontWeight: 600,
                  color: '#1C2D18',
                }}
              >
                Estadísticas de compras
              </h3>
              {detail.loading && (
                <p className='t14' style={{color: APP_PALETTE.textMuted}}>
                  Cargando pedidos…
                </p>
              )}
              {detail.error && (
                <p className='t14' style={{color: APP_PALETTE.accent}}>
                  {detail.error}
                </p>
              )}
              {!detail.loading && !detail.error && (
                <>
                  <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                    Pedidos desde el alta:{' '}
                    <strong>{detail.ordersCount}</strong>
                  </p>
                  <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                    Total pedidos (suma):{' '}
                    <strong>
                      {money(detail.ordersTotalCents, detail.ordersCurrency)}
                    </strong>
                  </p>
                  {detail.orders.length > 0 ? (
                    <ul
                      style={{
                        margin: '10px 0 0',
                        paddingLeft: 18,
                        color: '#3D3D3D',
                      }}
                    >
                      {detail.orders.slice(0, 8).map((o) => (
                        <li key={o.id} className='t14' style={{marginBottom: 6}}>
                          {o.human_order_number ?? o.id.slice(0, 8)} —{' '}
                          {labelForOrderStatus(o.status)} —{' '}
                          {money(o.total_cents, o.currency)} —{' '}
                          {new Date(o.created_at).toLocaleString('es-ES')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='t14' style={{margin: '8px 0 0', color: '#3D3D3D'}}>
                      Sin pedidos registrados.
                    </p>
                  )}
                </>
              )}
            </section>

            <section>
              <h3
                className='t14'
                style={{
                  margin: '0 0 8px',
                  fontWeight: 600,
                  color: '#1C2D18',
                }}
              >
                Direcciones guardadas
              </h3>
              <p className='t14' style={{margin: '4px 0', color: '#3D3D3D'}}>
                {detail.loading && 'Cargando…'}
                {!detail.loading && !detail.error && detail.addresses.length === 0 &&
                  'No hay direcciones guardadas.'}
              </p>
              {!detail.loading &&
                !detail.error &&
                detail.addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      marginBottom: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${APP_PALETTE.border}`,
                      backgroundColor: 'rgba(76, 119, 92, 0.06)',
                    }}
                  >
                    <p className='t14' style={{margin: '0 0 4px', fontWeight: 600}}>
                      {a.label?.trim() || 'Dirección'}
                    </p>
                    <p className='t14' style={{margin: 0, color: '#3D3D3D'}}>
                      {formatAddressLine(a)}
                    </p>
                  </div>
                ))}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
