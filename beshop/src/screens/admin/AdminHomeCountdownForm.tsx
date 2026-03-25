import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopHomeCountdownRow} from '../../types/shop';
import type {ShopProduct} from '../../types/catalog';
import {formatSupabaseError} from '../../utils/supabaseError';

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
  maxWidth: 720,
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export const AdminHomeCountdownForm: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [headlineText, setHeadlineText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [buttonLabel, setButtonLabel] = useState('Buy now');
  const [durDays, setDurDays] = useState(0);
  const [durHours, setDurHours] = useState(24);
  const [products, setProducts] = useState<Pick<ShopProduct, 'id' | 'name'>[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!supabase) {
      return;
    }
    const {data, error: qErr} = await supabase
      .from('shop_products')
      .select('id, name')
      .order('name', {ascending: true});
    if (qErr) {
      console.error(qErr);
      return;
    }
    setProducts((data ?? []) as Pick<ShopProduct, 'id' | 'name'>[]);
  }, []);

  const loadCountdown = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qErr} = await supabase
      .from('shop_home_countdown')
      .select(
        'id, enabled, product_id, ends_at, free_shipping, headline_text, body_text, button_label, updated_at',
      )
      .eq('id', 'default')
      .maybeSingle();

    setLoading(false);
    if (qErr) {
      setError(formatSupabaseError(qErr));
      return;
    }
    const row = data as ShopHomeCountdownRow | null;
    if (row) {
      setEnabled(Boolean(row.enabled));
      setFreeShipping(Boolean(row.free_shipping));
      setProductId(row.product_id ?? '');
      setEndsAtLocal(toDatetimeLocalValue(row.ends_at));
      setHeadlineText(
        (row as ShopHomeCountdownRow).headline_text?.trim() ?? '',
      );
      setBodyText(row.body_text ?? '');
      setButtonLabel(row.button_label?.trim() || 'Buy now');
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadCountdown();
  }, [loadCountdown]);

  const applyDurationFromNow = () => {
    const d = Math.max(0, durDays);
    const h = Math.max(0, Math.min(999, durHours));
    const ms = (d * 24 + h) * 3600000;
    const end = new Date(Date.now() + ms);
    setEndsAtLocal(toDatetimeLocalValue(end.toISOString()));
  };

  const save = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    const endsIso = fromDatetimeLocalValue(endsAtLocal);
    if (enabled) {
      if (!productId.trim()) {
        setError('Elige un producto para activar la cuenta regresiva.');
        return;
      }
      if (!endsIso) {
        setError('Indica la fecha y hora de finalización (o usa duración desde ahora).');
        return;
      }
      if (new Date(endsIso).getTime() <= Date.now()) {
        setError('La fecha de fin debe ser futura.');
        return;
      }
    }

    setSavedOk(false);
    setError(null);
    setSaving(true);
    const {error: uErr} = await supabase.from('shop_home_countdown').upsert(
      {
        id: 'default',
        enabled,
        product_id: productId.trim() || null,
        ends_at: enabled ? endsIso : null,
        free_shipping: enabled ? freeShipping : false,
        headline_text: headlineText.trim(),
        body_text: bodyText.trim(),
        button_label: buttonLabel.trim() || 'Buy now',
      },
      {onConflict: 'id'},
    );
    setSaving(false);
    if (uErr) {
      setError(formatSupabaseError(uErr));
      return;
    }
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3500);
    void loadCountdown();
  };

  return (
    <div style={card}>
      <h2
        style={{
          margin: '0 0 8px',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 20,
          fontWeight: 600,
          color: '#1C2D18',
        }}
      >
        Cuenta regresiva (home)
      </h2>
      <p
        className='t14'
        style={{
          margin: '0 0 16px',
          color: APP_PALETTE.priceMuted,
          lineHeight: 1.5,
        }}
      >
        Se muestra debajo de «Discounted Items»: reloj, foto del producto en una
        esquina y botón hacia la ficha. Elige producto, fecha de fin y textos.
      </p>

      {loading && (
        <p className='t16' style={{color: APP_PALETTE.textMuted}}>
          Cargando…
        </p>
      )}

      {!loading && error && (
        <p
          className='t16'
          style={{color: '#a33', marginBottom: 16, maxWidth: 720}}
        >
          {error}
        </p>
      )}

      {!loading && (
        <>
          <label style={{...labelStyle, display: 'flex', alignItems: 'center', gap: 10}}>
            <input
              type='checkbox'
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Mostrar en la tienda
          </label>

          <label
            style={{
              ...labelStyle,
              marginTop: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <input
              type='checkbox'
              checked={freeShipping}
              onChange={(e) => setFreeShipping(e.target.checked)}
              style={{marginTop: 2}}
            />
            <span>
              Envío gratis en esta oferta (solo si el cliente compra el producto
              destacado desde «Buy now» en la tarjeta de cuenta regresiva; el
              carrito debe incluir ese producto).
            </span>
          </label>

          <label style={{...labelStyle, marginTop: 14}} htmlFor='admin-cd-product'>
            Producto
          </label>
          <select
            id='admin-cd-product'
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

          <label style={labelStyle} htmlFor='admin-cd-ends'>
            Fecha y hora de finalización (cuenta regresiva hasta…)
          </label>
          <input
            id='admin-cd-ends'
            type='datetime-local'
            value={endsAtLocal}
            onChange={(e) => setEndsAtLocal(e.target.value)}
            style={{...inputStyle, marginBottom: 12}}
          />

          <p
            className='t12'
            style={{
              margin: '0 0 10px',
              color: APP_PALETTE.priceMuted,
              fontWeight: 600,
            }}
          >
            O fija la duración desde ahora:
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'flex-end',
              marginBottom: 16,
            }}
          >
            <div>
              <label
                className='t12'
                style={{...labelStyle, marginBottom: 4}}
                htmlFor='admin-cd-d'
              >
                Días
              </label>
              <input
                id='admin-cd-d'
                type='number'
                min={0}
                max={3650}
                value={durDays}
                onChange={(e) => setDurDays(Math.max(0, Number(e.target.value) || 0))}
                style={{...inputStyle, width: 88, marginBottom: 0}}
              />
            </div>
            <div>
              <label
                className='t12'
                style={{...labelStyle, marginBottom: 4}}
                htmlFor='admin-cd-h'
              >
                Horas
              </label>
              <input
                id='admin-cd-h'
                type='number'
                min={0}
                max={999}
                value={durHours}
                onChange={(e) => setDurHours(Math.max(0, Number(e.target.value) || 0))}
                style={{...inputStyle, width: 88, marginBottom: 0}}
              />
            </div>
            <button
              type='button'
              style={{...btnPrimary, marginBottom: 2}}
              onClick={applyDurationFromNow}
            >
              Aplicar duración
            </button>
          </div>

          <label style={labelStyle} htmlFor='admin-cd-headline'>
            Texto 1 — cabecera (título grande, ej. Cuenta regresiva)
          </label>
          <input
            id='admin-cd-headline'
            type='text'
            value={headlineText}
            onChange={(e) => setHeadlineText(e.target.value)}
            placeholder='Cuenta regresiva'
            style={{...inputStyle, marginBottom: 14, fontSize: 17, fontWeight: 600}}
          />

          <label style={labelStyle} htmlFor='admin-cd-body'>
            Texto 2 — descripción (más pequeño, ej. oferta con envío gratis)
          </label>
          <textarea
            id='admin-cd-body'
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={3}
            placeholder='Oferta: compra este producto con envío gratis, tiempo limitado.'
            style={{...inputStyle, marginBottom: 16, resize: 'vertical', fontSize: 14}}
          />

          <label style={labelStyle} htmlFor='admin-cd-btn'>
            Texto del botón (inglés recomendado)
          </label>
          <input
            id='admin-cd-btn'
            type='text'
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            placeholder='Buy now'
            style={{...inputStyle, marginBottom: 20}}
          />

          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button
              type='button'
              style={{
                ...btnPrimary,
                opacity: saving ? 0.7 : 1,
                pointerEvents: saving ? 'none' : 'auto',
              }}
              onClick={() => void save()}
            >
              {saving ? 'Guardando…' : 'Guardar cuenta regresiva'}
            </button>
            {savedOk && (
              <span
                className='t14'
                style={{color: APP_PALETTE.accentJade, fontWeight: 600}}
              >
                Guardado
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
