import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopCouponRow, ShopCouponType} from '../../types/shop';
import type {ShopProduct} from '../../types/catalog';
import {formatSupabaseError} from '../../utils/supabaseError';

type InnerTab = 'list' | 'create';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  fontFamily: 'Lato, sans-serif',
  fontSize: 15,
  color: '#1C2D18',
  backgroundColor: APP_PALETTE.imageWell,
  boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 22px',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.accent}`,
  background: APP_PALETTE.accent,
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 600,
};

const card: React.CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  padding: 24,
  boxSizing: 'border-box',
  maxWidth: 900,
};

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function couponTypeLabel(t: ShopCouponType): string {
  switch (t) {
    case 'percent_product':
      return '% artículo concreto';
    case 'percent_order':
      return '% cualquier artículo (pedido)';
    case 'free_shipping':
      return 'Envío gratis';
    default:
      return t;
  }
}

function fromDatetimeLocalValue(s: string): string | null {
  const t = s.trim();
  if (!t) {
    return null;
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString();
}

export const AdminOffersPanel: React.FC = () => {
  const [tab, setTab] = useState<InnerTab>('list');
  const [rows, setRows] = useState<ShopCouponRow[]>([]);
  const [products, setProducts] = useState<Pick<ShopProduct, 'id' | 'name'>[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const [couponType, setCouponType] =
    useState<ShopCouponType>('percent_order');
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [productId, setProductId] = useState('');
  const [displayName, setDisplayName] = useState('Candle Laine');
  const [startsLocal, setStartsLocal] = useState('');
  const [endsLocal, setEndsLocal] = useState('');

  const productNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) {
      m.set(p.id, p.name);
    }
    return m;
  }, [products]);

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const {data, error: qErr} = await supabase
      .from('shop_products')
      .select('id, name')
      .order('name', {ascending: true});
    if (!qErr && data) {
      setProducts(data as Pick<ShopProduct, 'id' | 'name'>[]);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qErr} = await supabase
      .from('shop_coupons')
      .select('*')
      .order('created_at', {ascending: false});
    setLoading(false);
    if (qErr) {
      setError(formatSupabaseError(qErr));
      return;
    }
    setRows((data ?? []) as ShopCouponRow[]);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const resetForm = () => {
    setCouponType('percent_order');
    setCode('');
    setDiscountPercent(10);
    setProductId('');
    setDisplayName('Candle Laine');
    setStartsLocal('');
    setEndsLocal('');
  };

  const saveCoupon = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    const c = normalizeCode(code);
    if (!c || c.length < 3) {
      setError('El código debe tener al menos 3 caracteres.');
      return;
    }
    if (couponType === 'percent_product' && !productId.trim()) {
      setError('Selecciona un producto para este cupón.');
      return;
    }
    if (
      (couponType === 'percent_order' || couponType === 'percent_product') &&
      (discountPercent < 1 || discountPercent > 100)
    ) {
      setError('El descuento debe estar entre 1 y 100 %.');
      return;
    }

    const startsIso = fromDatetimeLocalValue(startsLocal);
    const endsIso = fromDatetimeLocalValue(endsLocal);
    if (startsIso && endsIso && new Date(startsIso) >= new Date(endsIso)) {
      setError('La fecha de inicio debe ser anterior a la de fin.');
      return;
    }

    const payload: Record<string, unknown> = {
      code: c,
      coupon_type: couponType,
      display_name: displayName.trim() || 'Candle Laine',
      starts_at: startsIso,
      ends_at: endsIso,
      is_active: true,
    };

    if (couponType === 'free_shipping') {
      payload.discount_percent = null;
      payload.product_id = null;
    } else if (couponType === 'percent_order') {
      payload.discount_percent = discountPercent;
      payload.product_id = null;
    } else {
      payload.discount_percent = discountPercent;
      payload.product_id = productId.trim();
    }

    setSaving(true);
    setError(null);
    setSavedOk(false);
    const {error: insErr} = await supabase.from('shop_coupons').insert(payload);
    setSaving(false);
    if (insErr) {
      setError(formatSupabaseError(insErr));
      return;
    }
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3000);
    resetForm();
    setTab('list');
    void loadCoupons();
  };

  const deactivate = async (id: string) => {
    if (!supabase) {
      return;
    }
    const {error: uErr} = await supabase
      .from('shop_coupons')
      .update({is_active: false})
      .eq('id', id);
    if (uErr) {
      setError(formatSupabaseError(uErr));
      return;
    }
    void loadCoupons();
  };

  return (
    <div style={{width: '100%', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto'}}>
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
        Ofertas
      </h1>
      <p
        className='t18'
        style={{
          margin: 0,
          marginBottom: 20,
          lineHeight: 1.55,
          color: APP_PALETTE.textMuted,
        }}
      >
        Crea cupones con descuento (producto concreto o todo el pedido), envío
        gratis o fechas de caducidad. Aparecen en «My Promocodes» en la app.
      </p>

      <div
        role='tablist'
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            {id: 'list' as const, label: 'Cupones creados'},
            {id: 'create' as const, label: 'Nuevo cupón'},
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type='button'
              role='tab'
              aria-selected={active}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: `1px solid ${
                  active ? APP_PALETTE.accent : 'rgba(255,255,255,0.2)'
                }`,
                backgroundColor: active
                  ? 'rgba(241, 185, 127, 0.18)'
                  : 'rgba(255,255,255,0.06)',
                color: active ? APP_PALETTE.textOnDark : APP_PALETTE.textMuted,
                fontFamily: 'Lato, sans-serif',
                fontSize: 15,
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p
          className='t16'
          style={{color: '#a33', marginBottom: 16, maxWidth: 900}}
        >
          {error}
        </p>
      )}

      {tab === 'list' && (
        <div style={card}>
          {loading ? (
            <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
              Cargando…
            </p>
          ) : rows.length === 0 ? (
            <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
              Aún no hay cupones. Usa «Nuevo cupón» para crear uno.
            </p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                  color: '#1C2D18',
                }}
              >
                <thead>
                  <tr style={{textAlign: 'left', borderBottom: `1px solid ${APP_PALETTE.border}`}}>
                    <th style={{padding: '8px 6px'}}>Código</th>
                    <th style={{padding: '8px 6px'}}>Tipo</th>
                    <th style={{padding: '8px 6px'}}>Valor</th>
                    <th style={{padding: '8px 6px'}}>Producto</th>
                    <th style={{padding: '8px 6px'}}>Caduca</th>
                    <th style={{padding: '8px 6px'}}>Estado</th>
                    <th style={{padding: '8px 6px'}} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      style={{borderBottom: `1px solid ${APP_PALETTE.border}`}}
                    >
                      <td style={{padding: '10px 6px', fontWeight: 700}}>{r.code}</td>
                      <td style={{padding: '10px 6px'}}>
                        {couponTypeLabel(r.coupon_type)}
                      </td>
                      <td style={{padding: '10px 6px'}}>
                        {r.coupon_type === 'free_shipping'
                          ? '—'
                          : `${r.discount_percent}%`}
                      </td>
                      <td
                        style={{padding: '10px 6px', maxWidth: 180}}
                        className='number-of-lines-2'
                      >
                        {r.product_id
                          ? productNameById.get(r.product_id) ?? '—'
                          : '—'}
                      </td>
                      <td style={{padding: '10px 6px', fontSize: 13}}>
                        {r.ends_at
                          ? new Date(r.ends_at).toLocaleString()
                          : '—'}
                      </td>
                      <td style={{padding: '10px 6px'}}>
                        {r.is_active ? 'Activo' : 'Inactivo'}
                      </td>
                      <td style={{padding: '10px 6px'}}>
                        {r.is_active ? (
                          <button
                            type='button'
                            onClick={() => void deactivate(r.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: `1px solid ${APP_PALETTE.border}`,
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: APP_PALETTE.priceMuted,
                              fontWeight: 600,
                            }}
                          >
                            Desactivar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div style={card}>
          <h2
            style={{
              margin: '0 0 16px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
            }}
          >
            Nuevo cupón
          </h2>

          <label style={labelStyle} htmlFor='admin-offer-type'>
            Tipo de cupón
          </label>
          <select
            id='admin-offer-type'
            value={couponType}
            onChange={(e) =>
              setCouponType(e.target.value as ShopCouponType)
            }
            style={{...inputStyle, marginBottom: 16}}
          >
            <option value='percent_product'>
              Descuento % en un artículo concreto
            </option>
            <option value='percent_order'>
              Descuento % en cualquier artículo (pedido completo)
            </option>
            <option value='free_shipping'>Envío gratis</option>
          </select>

          <label style={labelStyle} htmlFor='admin-offer-code'>
            Código (se guarda en mayúsculas)
          </label>
          <input
            id='admin-offer-code'
            type='text'
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder='EJ: SUMMER24'
            style={{...inputStyle, marginBottom: 16}}
          />

          {(couponType === 'percent_order' ||
            couponType === 'percent_product') && (
            <>
              <label style={labelStyle} htmlFor='admin-offer-pct'>
                Porcentaje de descuento (1–100)
              </label>
              <input
                id='admin-offer-pct'
                type='number'
                min={1}
                max={100}
                value={discountPercent}
                onChange={(e) =>
                  setDiscountPercent(
                    Math.min(100, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                style={{...inputStyle, marginBottom: 16, maxWidth: 160}}
              />
            </>
          )}

          {couponType === 'percent_product' && (
            <>
              <label style={labelStyle} htmlFor='admin-offer-prod'>
                Producto
              </label>
              <select
                id='admin-offer-prod'
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                style={{...inputStyle, marginBottom: 16}}
              >
                <option value=''>— Seleccionar —</option>
                {products.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <label style={labelStyle} htmlFor='admin-offer-brand'>
            Nombre en la tarjeta (ej. marca)
          </label>
          <input
            id='admin-offer-brand'
            type='text'
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{...inputStyle, marginBottom: 16}}
          />

          <label style={labelStyle} htmlFor='admin-offer-start'>
            Válido desde (opcional)
          </label>
          <input
            id='admin-offer-start'
            type='datetime-local'
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            style={{...inputStyle, marginBottom: 12}}
          />

          <label style={labelStyle} htmlFor='admin-offer-end'>
            Caduca el (opcional)
          </label>
          <input
            id='admin-offer-end'
            type='datetime-local'
            value={endsLocal}
            onChange={(e) => setEndsLocal(e.target.value)}
            style={{...inputStyle, marginBottom: 20}}
          />
          <p
            className='t12'
            style={{
              margin: '-12px 0 20px',
              color: APP_PALETTE.priceMuted,
              lineHeight: 1.45,
            }}
          >
            Si no indicas fechas, el cupón no caduca por tiempo (sigue activo
            mientras esté en estado activo).
          </p>

          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button
              type='button'
              style={{
                ...btnPrimary,
                opacity: saving ? 0.7 : 1,
                pointerEvents: saving ? 'none' : 'auto',
              }}
              onClick={() => void saveCoupon()}
            >
              {saving ? 'Guardando…' : 'Crear cupón'}
            </button>
            {savedOk && (
              <span
                className='t14'
                style={{color: APP_PALETTE.accentJade, fontWeight: 600}}
              >
                Creado
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
