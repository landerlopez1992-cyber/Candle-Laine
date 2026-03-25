import React, {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {supabase} from '../supabaseClient';
import {APP_PALETTE} from '../theme/appPalette';
import type {ShopPaymentSettingsRow} from '../types/shop';

export const AccountBlocked: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const [settings, setSettings] = useState<ShopPaymentSettingsRow | null>(null);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let cancelled = false;
    void supabase
      .from('shop_payment_settings')
      .select('id, zelle_enabled, zelle_phone, zelle_instructions, updated_at')
      .eq('id', 'default')
      .maybeSingle()
      .then(({data}) => {
        if (!cancelled && data) {
          setSettings(data as ShopPaymentSettingsRow);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      className='scrollable'
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div className='container' style={{width: '100%', maxWidth: 440}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg.LogoSvg />
        </div>

        <div
          style={{
            backgroundColor: APP_PALETTE.cartCardSurface,
            border: `1px solid ${APP_PALETTE.border}`,
            borderRadius: 12,
            padding: '24px 20px',
            boxSizing: 'border-box',
          }}
        >
          <h1
            className='t18'
            style={{
              margin: '0 0 12px',
              textAlign: 'center',
              color: '#1C2D18',
              fontWeight: 600,
            }}
          >
            Cuenta suspendida
          </h1>
          <p
            className='t16'
            style={{
              margin: '0 0 16px',
              lineHeight: 1.55,
              color: '#3D3D3D',
              textAlign: 'center',
            }}
          >
            Tu acceso a la tienda ha sido desactivado. Para resolverlo, contacta con
            Candle Laine usando los datos siguientes.
          </p>

          <div
            style={{
              borderTop: `1px solid ${APP_PALETTE.border}`,
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <p
              className='t14'
              style={{
                margin: '0 0 8px',
                fontWeight: 600,
                color: '#1C2D18',
              }}
            >
              Contacto de la empresa
            </p>
            {settings?.zelle_phone ? (
              <p className='t16' style={{margin: '0 0 8px', color: '#3D3D3D'}}>
                Teléfono / Zelle:{' '}
                <span style={{wordBreak: 'break-all'}}>{settings.zelle_phone}</span>
              </p>
            ) : (
              <p className='t16' style={{margin: '0 0 8px', color: '#3D3D3D'}}>
                Los datos de contacto se cargan desde el panel de administración (Zelle).
              </p>
            )}
            {settings?.zelle_instructions?.trim() ? (
              <p
                className='t14'
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  color: '#3D3D3D',
                }}
              >
                {settings.zelle_instructions.trim()}
              </p>
            ) : null}
          </div>

          <div style={{marginTop: 24, textAlign: 'center'}}>
            <Link
              to={Routes.SignIn}
              className='clickable'
              style={{
                display: 'inline-block',
                padding: '12px 22px',
                borderRadius: 8,
                border: `1px solid ${APP_PALETTE.accent}`,
                color: APP_PALETTE.accent,
                fontFamily: 'Lato, sans-serif',
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};
