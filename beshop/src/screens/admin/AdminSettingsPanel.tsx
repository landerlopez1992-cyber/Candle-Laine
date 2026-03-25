import React, {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import {supabase} from '../../supabaseClient';
import {APP_PALETTE} from '../../theme/appPalette';
import type {ShopPaymentSettingsRow} from '../../types/shop';
import {
  completeStripeConnectOAuth,
  startStripeConnectOAuth,
} from '../../utils/stripeConnectAdmin';
import {formatSupabaseError} from '../../utils/supabaseError';

type SettingsTab = 'general' | 'payment' | 'stripe';

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

const STRIPE_OAUTH_START_PREFIX = 'stripe_oauth_start_';

export const AdminSettingsPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<SettingsTab>(() =>
    searchParams.get('code') && searchParams.get('state') ? 'stripe' : 'payment',
  );

  const [zelleEnabled, setZelleEnabled] = useState(false);
  const [zellePhone, setZellePhone] = useState('');
  const [zelleInstructions, setZelleInstructions] = useState('');

  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [stripeLivemode, setStripeLivemode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const [stripeLinkBusy, setStripeLinkBusy] = useState(false);
  const [stripeOauthError, setStripeOauthError] = useState<string | null>(null);
  const [stripeSavedOk, setStripeSavedOk] = useState(false);
  const [stripeSavingToggle, setStripeSavingToggle] = useState(false);
  const [stripeDisconnecting, setStripeDisconnecting] = useState(false);

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
      setStripeEnabled(row.stripe_enabled ?? false);
      setStripeAccountId(row.stripe_connect_account_id ?? '');
      setStripeLivemode(row.stripe_livemode ?? false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) {
      return;
    }
    const startKey = `${STRIPE_OAUTH_START_PREFIX}${code}`;
    if (sessionStorage.getItem(startKey)) {
      setSearchParams({}, {replace: true});
      return;
    }
    sessionStorage.setItem(startKey, '1');
    setTab('stripe');
    setSearchParams({}, {replace: true});
    setStripeOauthError(null);
    setStripeLinkBusy(true);
    void completeStripeConnectOAuth(code, state).then((r) => {
      setStripeLinkBusy(false);
      if (r.ok) {
        setStripeSavedOk(true);
        window.setTimeout(() => setStripeSavedOk(false), 4000);
        void load();
      } else {
        sessionStorage.removeItem(startKey);
        setStripeOauthError(
          r.error === 'invalid_state'
            ? 'La sesión de vinculación caducó o no coincide. Inténtalo de nuevo.'
            : r.error ?? 'No se pudo completar la vinculación con Stripe.',
        );
      }
    });
  }, [searchParams, setSearchParams, load]);

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

  const stripeClientConfigured = Boolean(
    process.env.REACT_APP_STRIPE_CONNECT_CLIENT_ID?.trim(),
  );

  const onLinkStripe = () => {
    setStripeOauthError(null);
    if (!startStripeConnectOAuth()) {
      setStripeOauthError(
        'Falta REACT_APP_STRIPE_CONNECT_CLIENT_ID en el entorno del front (ID de cliente Connect, ca_…).',
      );
    }
  };

  const saveStripeToggle = async () => {
    if (!supabase || !stripeAccountId.trim()) {
      return;
    }
    setStripeSavingToggle(true);
    setStripeOauthError(null);
    const {error: uError} = await supabase
      .from('shop_payment_settings')
      .update({stripe_enabled: stripeEnabled})
      .eq('id', 'default');
    setStripeSavingToggle(false);
    if (uError) {
      setStripeOauthError(formatSupabaseError(uError));
      return;
    }
    setStripeSavedOk(true);
    window.setTimeout(() => setStripeSavedOk(false), 3500);
  };

  const disconnectStripe = async () => {
    if (!supabase) {
      return;
    }
    setStripeDisconnecting(true);
    setStripeOauthError(null);
    const {error: uError} = await supabase
      .from('shop_payment_settings')
      .update({
        stripe_enabled: false,
        stripe_connect_account_id: '',
        stripe_livemode: false,
      })
      .eq('id', 'default');
    setStripeDisconnecting(false);
    if (uError) {
      setStripeOauthError(formatSupabaseError(uError));
      return;
    }
    setStripeEnabled(false);
    setStripeAccountId('');
    setStripeLivemode(false);
    void load();
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
            Stripe
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
            Vincula tu cuenta de Stripe Connect para recibir pagos con tarjeta en
            la app. Al pulsar «Linkear cuenta» irás a Stripe para iniciar sesión y
            elegir la cuenta; al volver aquí guardamos el identificador de la cuenta
            de forma segura en el servidor.
          </p>

          {loading && (
            <p className='t16' style={{color: APP_PALETTE.priceMuted}}>
              Cargando…
            </p>
          )}

          {!loading && stripeLinkBusy && (
            <p className='t16' style={{color: APP_PALETTE.priceMuted, marginBottom: 16}}>
              Completando vinculación con Stripe…
            </p>
          )}

          {!loading && !stripeLinkBusy && stripeOauthError && (
            <p
              className='t16'
              style={{color: '#a33', marginBottom: 16, maxWidth: 560}}
            >
              {stripeOauthError}
            </p>
          )}

          {!loading && !stripeLinkBusy && (
            <>
              {stripeAccountId ? (
                <div style={{marginBottom: 22, maxWidth: 560}}>
                  <p
                    className='t14'
                    style={{
                      margin: '0 0 8px',
                      color: APP_PALETTE.priceMuted,
                      lineHeight: 1.5,
                    }}
                  >
                    Cuenta vinculada
                  </p>
                  <p
                    className='t14'
                    style={{
                      margin: 0,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      color: '#1C2D18',
                      fontWeight: 600,
                    }}
                  >
                    {stripeAccountId}
                  </p>
                  <p className='t12' style={{margin: '8px 0 0', color: APP_PALETTE.priceMuted}}>
                    Modo: {stripeLivemode ? 'Live' : 'Test'}
                  </p>
                </div>
              ) : (
                <p
                  className='t14'
                  style={{
                    margin: '0 0 18px',
                    color: APP_PALETTE.priceMuted,
                    lineHeight: 1.5,
                  }}
                >
                  Aún no hay cuenta vinculada. Registra en el{' '}
                  <strong style={{color: '#1C2D18'}}>redirect URI</strong> de Stripe
                  Connect:{' '}
                  <span style={{fontFamily: 'monospace', fontSize: 12}}>
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/admin`
                      : '…/admin'}
                  </span>
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 22,
                  maxWidth: 560,
                  opacity: stripeAccountId ? 1 : 0.45,
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
                    Activar Stripe en la tienda
                  </span>
                  <p
                    className='t14'
                    style={{
                      margin: '4px 0 0',
                      color: APP_PALETTE.priceMuted,
                      lineHeight: 1.45,
                    }}
                  >
                    Solo disponible con cuenta vinculada. El checkout usará esta
                    cuenta cuando integremos el cobro con tarjeta.
                  </p>
                </div>
                <button
                  type='button'
                  role='switch'
                  aria-checked={stripeEnabled}
                  disabled={!stripeAccountId}
                  onClick={() => setStripeEnabled((v) => !v)}
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 30,
                    borderRadius: 15,
                    border: 'none',
                    backgroundColor:
                      stripeEnabled && stripeAccountId
                        ? APP_PALETTE.accentJade
                        : 'rgba(0,0,0,0.2)',
                    cursor: stripeAccountId ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: stripeEnabled && stripeAccountId ? 26 : 3,
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

              {stripeAccountId && (
                <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18}}>
                  <button
                    type='button'
                    style={{
                      ...btnPrimary,
                      opacity: stripeSavingToggle ? 0.7 : 1,
                      pointerEvents: stripeSavingToggle ? 'none' : 'auto',
                    }}
                    onClick={() => void saveStripeToggle()}
                  >
                    {stripeSavingToggle ? 'Guardando…' : 'Guardar preferencia Stripe'}
                  </button>
                </div>
              )}

              <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'}}>
                <button
                  type='button'
                  style={{
                    ...btnPrimary,
                    opacity:
                      !stripeClientConfigured || stripeLinkBusy ? 0.55 : 1,
                    pointerEvents:
                      !stripeClientConfigured || stripeLinkBusy ? 'none' : 'auto',
                  }}
                  onClick={onLinkStripe}
                >
                  Linkear cuenta
                </button>
                {stripeAccountId && (
                  <button
                    type='button'
                    onClick={() => void disconnectStripe()}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: `1px solid ${APP_PALETTE.border}`,
                      background: 'transparent',
                      color: APP_PALETTE.priceMuted,
                      fontFamily: 'Lato, sans-serif',
                      fontSize: 14,
                      cursor: stripeDisconnecting ? 'wait' : 'pointer',
                      fontWeight: 600,
                    }}
                    disabled={stripeDisconnecting}
                  >
                    {stripeDisconnecting ? 'Desvinculando…' : 'Desvincular cuenta'}
                  </button>
                )}
                {stripeSavedOk && (
                  <span
                    className='t14'
                    style={{color: APP_PALETTE.accentJade, fontWeight: 600}}
                  >
                    Guardado
                  </span>
                )}
              </div>

              {!stripeClientConfigured && (
                <p
                  className='t12'
                  style={{
                    marginTop: 16,
                    color: APP_PALETTE.priceMuted,
                    maxWidth: 560,
                    lineHeight: 1.5,
                  }}
                >
                  Configura <code style={{fontSize: 11}}>REACT_APP_STRIPE_CONNECT_CLIENT_ID</code>{' '}
                  (Dashboard Stripe → Connect → client ID) y despliega la función{' '}
                  <code style={{fontSize: 11}}>stripe-connect-oauth</code> con{' '}
                  <code style={{fontSize: 11}}>STRIPE_SECRET_KEY</code> y{' '}
                  <code style={{fontSize: 11}}>STRIPE_CONNECT_CLIENT_ID</code>.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
