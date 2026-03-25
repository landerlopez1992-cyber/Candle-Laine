import React, {useCallback, useEffect, useState} from 'react';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopPaymentSettingsRow, ShopStripeRuntimeRow} from '../../types/shop';
import {formatSupabaseError} from '../../utils/supabaseError';
import {AdminMuralSettings} from './AdminMuralSettings';

type SettingsTab = 'general' | 'payment' | 'stripe' | 'mural';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Lato, sans-serif',
  fontSize: 13,
  color: APP_PALETTE.textMuted,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 560,
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
  maxWidth: 640,
};

export const AdminSettingsPanel: React.FC = () => {
  const [tab, setTab] = useState<SettingsTab>('payment');

  const [zelleEnabled, setZelleEnabled] = useState(false);
  const [zellePhone, setZellePhone] = useState('');
  const [zelleInstructions, setZelleInstructions] = useState('');

  const [stripeUseTestMode, setStripeUseTestMode] = useState(true);
  const [stripePublishableKeyTest, setStripePublishableKeyTest] = useState('');
  const [stripePublishableKeyLive, setStripePublishableKeyLive] = useState('');
  const [stripeSecretKeyTest, setStripeSecretKeyTest] = useState('');
  const [stripeSecretKeyLive, setStripeSecretKeyLive] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const [stripeOauthError, setStripeOauthError] = useState<string | null>(null);
  const [stripeSavedOk, setStripeSavedOk] = useState(false);
  const [stripeRuntimeSaving, setStripeRuntimeSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const {data, error: qError} = await supabase
      .from('shop_payment_settings')
      .select(
        'id, zelle_enabled, zelle_phone, zelle_instructions, stripe_enabled, stripe_connect_account_id, stripe_livemode, updated_at',
      )
      .eq('id', 'default')
      .maybeSingle();

    setLoading(false);
    if (qError) {
      setError(formatSupabaseError(qError));
      return;
    }
    const row = data as ShopPaymentSettingsRow | null;
    if (row) {
      setZelleEnabled(row.zelle_enabled);
      setZellePhone(row.zelle_phone ?? '');
      setZelleInstructions(row.zelle_instructions ?? '');
    }

    const {data: runtimeData, error: runtimeErr} = await supabase
      .from('shop_stripe_runtime')
      .select(
        'id, use_test_mode, publishable_key_test, publishable_key_live, secret_key_test, secret_key_live, updated_at',
      )
      .eq('id', 'default')
      .maybeSingle();
    if (runtimeErr) {
      setError(formatSupabaseError(runtimeErr));
      return;
    }
    const runtime = runtimeData as ShopStripeRuntimeRow | null;
    if (runtime) {
      setStripeUseTestMode(runtime.use_test_mode ?? true);
      setStripePublishableKeyTest(runtime.publishable_key_test ?? '');
      setStripePublishableKeyLive(runtime.publishable_key_live ?? '');
      setStripeSecretKeyTest(runtime.secret_key_test ?? '');
      setStripeSecretKeyLive(runtime.secret_key_live ?? '');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePayment = async () => {
    if (!supabase) {
      setError('Supabase no está configurado.');
      return;
    }
    setSavedOk(false);
    setError(null);
    setSaving(true);
    const {error: uError} = await supabase.from('shop_payment_settings').upsert(
      {
        id: 'default',
        zelle_enabled: zelleEnabled,
        zelle_phone: zellePhone.trim(),
        zelle_instructions: zelleInstructions,
      },
      {onConflict: 'id'},
    );
    setSaving(false);
    if (uError) {
      setError(formatSupabaseError(uError));
      return;
    }
    setSavedOk(true);
    window.setTimeout(() => setSavedOk(false), 3500);
  };

  const saveStripeRuntime = async () => {
    if (!supabase) {
      return;
    }
    setStripeOauthError(null);
    setStripeRuntimeSaving(true);
    const {error: uError} = await supabase.from('shop_stripe_runtime').upsert(
      {
        id: 'default',
        use_test_mode: stripeUseTestMode,
        publishable_key_test: stripePublishableKeyTest.trim(),
        publishable_key_live: stripePublishableKeyLive.trim(),
        secret_key_test: stripeSecretKeyTest.trim(),
        secret_key_live: stripeSecretKeyLive.trim(),
      },
      {onConflict: 'id'},
    );
    setStripeRuntimeSaving(false);
    if (uError) {
      setStripeOauthError(formatSupabaseError(uError));
      return;
    }
    setStripeSavedOk(true);
    window.setTimeout(() => setStripeSavedOk(false), 3500);
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
        Ajustes
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
        Configuración general del panel, integraciones y preferencias.
      </p>

      <div
        role='tablist'
        aria-label='Secciones de ajustes'
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            {id: 'general' as const, label: 'General'},
            {id: 'payment' as const, label: 'Métodos de pago'},
            {id: 'stripe' as const, label: 'Stripe'},
            {id: 'mural' as const, label: 'Mural'},
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

      {tab === 'general' && (
        <div
          style={{
            minHeight: 220,
            width: '100%',
            maxWidth: 640,
            borderRadius: 12,
            border: `1px dashed ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.imageWell,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <p
            className='t16'
            style={{
              margin: 0,
              maxWidth: 560,
              lineHeight: 1.6,
              color: APP_PALETTE.priceMuted,
            }}
          >
            Contenido de «General» — próximamente.
          </p>
        </div>
      )}

      {tab === 'payment' && (
        <div style={card}>
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
            }}
          >
            Zelle
          </h2>
          <p
            className='t14'
            style={{
              margin: 0,
              marginBottom: 22,
              lineHeight: 1.55,
              color: APP_PALETTE.priceMuted,
            }}
          >
            Los datos que guardes aquí se mostrarán a los clientes cuando elijan
            pagar con Zelle en el checkout.
          </p>

          {loading && (
            <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
              Cargando…
            </p>
          )}
          {!loading && error && (
            <p
              className='t16'
              style={{color: '#a33', marginBottom: 16, maxWidth: 560}}
            >
              {error}
            </p>
          )}

          {!loading && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 22,
                  maxWidth: 560,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: 'Lato, sans-serif',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#1C2D18',
                    }}
                  >
                    Activar Zelle en la tienda
                  </span>
                  <p
                    className='t14'
                    style={{
                      margin: '4px 0 0',
                      color: APP_PALETTE.priceMuted,
                      lineHeight: 1.45,
                    }}
                  >
                    Si está desactivado, la opción Zelle no aparecerá en el
                    método de pago.
                  </p>
                </div>
                <button
                  type='button'
                  role='switch'
                  aria-checked={zelleEnabled}
                  onClick={() => setZelleEnabled((v) => !v)}
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 30,
                    borderRadius: 15,
                    border: 'none',
                    backgroundColor: zelleEnabled
                      ? APP_PALETTE.accentJade
                      : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: zelleEnabled ? 26 : 3,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s ease',
                    }}
                  />
                </button>
              </div>

              <label style={labelStyle} htmlFor='admin-zelle-phone'>
                Número de teléfono o correo (Zelle)
              </label>
              <input
                id='admin-zelle-phone'
                type='text'
                autoComplete='off'
                value={zellePhone}
                onChange={(e) => setZellePhone(e.target.value)}
                placeholder='Ej. +1 305 555 0100 o correo@ejemplo.com'
                style={{...inputStyle, marginBottom: 18, maxWidth: '100%'}}
              />

              <label style={labelStyle} htmlFor='admin-zelle-instructions'>
                Texto adicional para el cliente
              </label>
              <textarea
                id='admin-zelle-instructions'
                value={zelleInstructions}
                onChange={(e) => setZelleInstructions(e.target.value)}
                placeholder='Instrucciones: incluye el nombre que verán en Zelle, plazo para enviar el comprobante, etc.'
                rows={5}
                style={{
                  ...inputStyle,
                  marginBottom: 22,
                  maxWidth: '100%',
                  minHeight: 120,
                  resize: 'vertical',
                }}
              />

              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <button
                  type='button'
                  style={{
                    ...btnPrimary,
                    opacity: saving ? 0.7 : 1,
                    pointerEvents: saving ? 'none' : 'auto',
                  }}
                  onClick={() => void savePayment()}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
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
      )}

      {tab === 'stripe' && (
        <div style={{maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16}}>

          {/* Badge modo activo — igual que GoodBarber */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 8,
              border: `1px solid ${stripeUseTestMode ? '#d97706' : APP_PALETTE.accentJade}`,
              backgroundColor: stripeUseTestMode
                ? 'rgba(217,119,6,0.08)'
                : 'rgba(76,119,92,0.12)',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: stripeUseTestMode ? '#d97706' : APP_PALETTE.accentJade,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: 14,
                color: '#1C2D18',
              }}
            >
              Tu modo de aplicación es:{' '}
              <strong style={{color: stripeUseTestMode ? '#d97706' : APP_PALETTE.accentJade}}>
                {stripeUseTestMode ? 'PRUEBA' : 'EN VIVO'}
              </strong>
            </span>
          </div>

          {/* Bloque principal */}
          <div style={card}>
            <h2
              style={{
                margin: '0 0 4px',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 18,
                fontWeight: 700,
                color: '#1C2D18',
              }}
            >
              Conexión a proveedores de pago
            </h2>
            <p
              className='t13'
              style={{margin: '0 0 20px', color: APP_PALETTE.priceMuted, lineHeight: 1.55}}
            >
              Permite que los proveedores de pago acepten tarjetas de crédito durante el pago.
            </p>

            {/* Separador */}
            <div style={{height: 1, backgroundColor: APP_PALETTE.border, marginBottom: 20}} />

            {/* Stripe logo + descripción */}
            <div style={{marginBottom: 8}}>
              <span
                style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#635bff',
                  letterSpacing: '-0.5px',
                }}
              >
                stripe
              </span>
              <span
                className='t13'
                style={{marginLeft: 10, color: APP_PALETTE.priceMuted}}
              >
                | Para tarjetas de crédito y Apple Pay
              </span>
            </div>
            <p className='t13' style={{margin: '0 0 6px', color: APP_PALETTE.priceMuted, lineHeight: 1.55}}>
              Stripe es un proveedor de pagos con una estructura de tarifas simple y sin costos ocultos.
              Configura la conexión entre Stripe y tu aplicación para recibir pagos.
            </p>
            <p className='t13' style={{margin: '0 0 20px', color: APP_PALETTE.priceMuted}}>
              Tienda simple: solo guarda credenciales Stripe de prueba y en vivo.
              No requiere Stripe Connect ni proceso OAuth.
            </p>

            {loading && (
              <p className='t15' style={{color: APP_PALETTE.priceMuted}}>Cargando…</p>
            )}
            {!loading && stripeOauthError && (
              <p className='t14' style={{color: '#a33', marginBottom: 14, maxWidth: 520}}>
                {stripeOauthError}
              </p>
            )}
            {!loading && stripeSavedOk && (
              <p className='t14' style={{color: APP_PALETTE.accentJade, fontWeight: 600, marginBottom: 14}}>
                ✓ Vinculación completada y guardada.
              </p>
            )}

            <p className='t13' style={{margin: '0 0 24px', color: APP_PALETTE.priceMuted}}>
              Completa `pk_test` + `sk_test` para pruebas. Cuando quieras salir en vivo,
              agrega `pk_live` + `sk_live` y cambia el modo activo.
            </p>

            {/* Separador */}
            <div style={{height: 1, backgroundColor: APP_PALETTE.border, marginBottom: 20}} />

            {/* Switch modo activo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                maxWidth: 520,
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#1C2D18',
                  }}
                >
                  Modo activo: {stripeUseTestMode ? 'Prueba' : 'En vivo'}
                </span>
                <p className='t13' style={{margin: '4px 0 0', color: APP_PALETTE.priceMuted, lineHeight: 1.4}}>
                  Alterna entre prueba y producción. Guarda para aplicar.
                </p>
              </div>
              <button
                type='button'
                role='switch'
                aria-checked={!stripeUseTestMode}
                onClick={() => setStripeUseTestMode((v) => !v)}
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 30,
                  borderRadius: 15,
                  border: 'none',
                  backgroundColor: stripeUseTestMode ? '#d97706' : APP_PALETTE.accentJade,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: stripeUseTestMode ? 3 : 29,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* Botón guardar modo activo */}
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4}}>
              <button
                type='button'
                style={{
                  ...btnPrimary,
                  opacity: stripeRuntimeSaving ? 0.7 : 1,
                  pointerEvents: stripeRuntimeSaving ? 'none' : 'auto',
                }}
                onClick={() => void saveStripeRuntime()}
              >
                {stripeRuntimeSaving ? 'Guardando…' : 'Guardar modo activo'}
              </button>
            </div>
          </div>

          {/* Bloque credenciales — separado y colapsable visualmente */}
          <div style={{...card, backgroundColor: 'rgba(255,255,255,0.6)'}}>
            <h3
              style={{
                margin: '0 0 4px',
                fontFamily: 'Lato, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#1C2D18',
              }}
            >
              Credenciales Stripe
            </h3>
            <p className='t12' style={{margin: '0 0 16px', color: APP_PALETTE.priceMuted, lineHeight: 1.5}}>
              Ingresa tus Publishable Keys y Secret Keys. Solo guarda y usa el switch de modo.
            </p>

            <label style={labelStyle}>Publishable Key — Prueba (pk_test_...)</label>
            <input
              type='text'
              value={stripePublishableKeyTest}
              onChange={(e) => setStripePublishableKeyTest(e.target.value)}
              placeholder='pk_test_...'
              style={{...inputStyle, marginBottom: 10, maxWidth: '100%'}}
            />
            <label style={labelStyle}>Secret Key — Prueba (sk_test_...)</label>
            <input
              type='password'
              value={stripeSecretKeyTest}
              onChange={(e) => setStripeSecretKeyTest(e.target.value)}
              placeholder='sk_test_...'
              style={{...inputStyle, marginBottom: 14, maxWidth: '100%'}}
            />
            <label style={labelStyle}>Publishable Key — En vivo (pk_live_...)</label>
            <input
              type='text'
              value={stripePublishableKeyLive}
              onChange={(e) => setStripePublishableKeyLive(e.target.value)}
              placeholder='pk_live_...'
              style={{...inputStyle, marginBottom: 10, maxWidth: '100%'}}
            />
            <label style={labelStyle}>Secret Key — En vivo (sk_live_...)</label>
            <input
              type='password'
              value={stripeSecretKeyLive}
              onChange={(e) => setStripeSecretKeyLive(e.target.value)}
              placeholder='sk_live_...'
              style={{...inputStyle, marginBottom: 16, maxWidth: '100%'}}
            />
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <button
                type='button'
                style={{
                  ...btnPrimary,
                  opacity: stripeRuntimeSaving ? 0.7 : 1,
                  pointerEvents: stripeRuntimeSaving ? 'none' : 'auto',
                }}
                onClick={() => void saveStripeRuntime()}
              >
                {stripeRuntimeSaving ? 'Guardando…' : 'Guardar credenciales'}
              </button>
              {stripeSavedOk && (
                <span className='t13' style={{color: APP_PALETTE.accentJade, fontWeight: 600}}>
                  Guardado
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'mural' && <AdminMuralSettings />}
    </div>
  );
};
