import React, {useCallback, useEffect, useState} from 'react';

import {CHECKOUT_CREDIT_CARDS} from '../constants/checkoutPayment';
import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {setCheckoutPaymentSelection} from '../store/slices/paymentSlice';
import {APP_PALETTE} from '../theme/appPalette';
import type {
  CheckoutPaymentDetailState,
  ShopPaymentSettingsRow,
} from '../types/shop';

const checkoutCardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
};

const radioOuter = (active: boolean) =>
  ({
    width: 20,
    height: 20,
    borderRadius: 10,
    border: `2px solid ${active ? APP_PALETTE.accent : '#999999'}`,
  }) as const;

export const CheckoutPaymentDetail: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();

  const rawState = location.state as
    | CheckoutPaymentDetailState
    | null
    | undefined;
  const method = rawState?.method;
  const cardId = rawState?.cardId;

  const [paymentSettings, setPaymentSettings] =
    useState<ShopPaymentSettingsRow | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!method) {
      navigate(Routes.CheckoutPaymentMethod, {replace: true});
    }
  }, [method, navigate]);

  useEffect(() => {
    if (method !== 'zelle' || !supabase) {
      if (method === 'zelle' && !supabase) {
        setSettingsReady(true);
      }
      return;
    }
    let cancelled = false;
    void supabase
      .from('shop_payment_settings')
      .select('id, zelle_enabled, zelle_phone, zelle_instructions, updated_at')
      .eq('id', 'default')
      .maybeSingle()
      .then(({data, error}) => {
        if (cancelled) {
          return;
        }
        if (!error && data) {
          setPaymentSettings(data as ShopPaymentSettingsRow);
        }
        setSettingsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [method]);

  useEffect(() => {
    if (method !== 'zelle' || !settingsReady) {
      return;
    }
    const enabled = paymentSettings?.zelle_enabled === true;
    if (!enabled) {
      navigate(Routes.CheckoutPaymentMethod, {replace: true});
    }
  }, [method, settingsReady, paymentSettings?.zelle_enabled, navigate]);

  useEffect(() => {
    if (method !== 'card') {
      return;
    }
    if (!cardId || !CHECKOUT_CREDIT_CARDS.some((c) => c.id === cardId)) {
      navigate(Routes.CheckoutPaymentMethod, {replace: true});
    }
  }, [method, cardId, navigate]);

  const handleAccept = useCallback(() => {
    if (!method) {
      return;
    }
    if (method === 'card') {
      if (!cardId) {
        return;
      }
      dispatch(setCheckoutPaymentSelection({kind: 'card', cardId}));
    } else {
      dispatch(setCheckoutPaymentSelection({kind: method}));
    }
    navigate(Routes.Checkout);
  }, [method, cardId, dispatch, navigate]);

  if (!method) {
    return null;
  }

  const cardRow =
    method === 'card' && cardId
      ? CHECKOUT_CREDIT_CARDS.find((c) => c.id === cardId)
      : undefined;

  const headerTitle =
    method === 'zelle'
      ? 'Zelle'
      : method === 'installments'
        ? 'Pagar en cuotas'
        : cardRow
          ? cardRow.name
          : 'Tarjeta';

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title={headerTitle}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element | null => {
    if (method === 'card' && !cardRow) {
      return null;
    }

    if (method === 'zelle' && !settingsReady) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
          }}
        >
          <p className='t16' style={{color: APP_PALETTE.textOnDark}}>
            Cargando…
          </p>
        </main>
      );
    }

    if (method === 'zelle' && paymentSettings) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            paddingBottom: 28,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
          }}
        >
          <components.Container
            containerStyle={{
              ...checkoutCardStyle,
              marginBottom: 12,
            }}
          >
            <div
              className='row-center-space-between'
              style={{marginBottom: 18}}
            >
              <h5 style={{color: 'var(--text-on-light)', margin: 0}}>Zelle</h5>
              <div style={radioOuter(true)} className='center'>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: APP_PALETTE.accent,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--border-color)',
                marginBottom: 18,
              }}
            />
            <p
              className='t14'
              style={{
                margin: '0 0 8px',
                color: 'var(--text-on-light)',
                opacity: 0.9,
              }}
            >
              Envía el pago a:
            </p>
            <p
              className='t16'
              style={{
                margin: '0 0 16px',
                color: 'var(--text-on-light)',
                fontWeight: 600,
                wordBreak: 'break-word',
              }}
            >
              {paymentSettings.zelle_phone.trim()
                ? paymentSettings.zelle_phone.trim()
                : 'El número o correo de Zelle se configurará pronto.'}
            </p>
            {Boolean(paymentSettings.zelle_instructions.trim()) && (
              <p
                className='t14'
                style={{
                  margin: 0,
                  color: 'var(--text-on-light)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {paymentSettings.zelle_instructions}
              </p>
            )}
          </components.Container>
          <section style={{paddingTop: 28}}>
            <components.Button
              text='Aceptar'
              onClick={handleAccept}
              containerStyle={{textTransform: 'none', fontSize: 16}}
            />
          </section>
        </main>
      );
    }

    if (method === 'installments') {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            paddingBottom: 28,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
          }}
        >
          <components.Container containerStyle={{...checkoutCardStyle}}>
            <div
              className='row-center-space-between'
              style={{marginBottom: 18}}
            >
              <h5 style={{color: 'var(--text-on-light)', margin: 0}}>
                Pagar en cuotas
              </h5>
              <div style={radioOuter(true)} className='center'>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: APP_PALETTE.accent,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--border-color)',
                marginBottom: 18,
              }}
            />
            <p
              className='t14'
              style={{
                margin: 0,
                color: 'var(--text-on-light)',
                lineHeight: 1.55,
              }}
            >
              Elige cuotas al confirmar el pedido. Si no ves la opción, contacta
              con soporte.
            </p>
          </components.Container>
          <section style={{paddingTop: 28}}>
            <components.Button
              text='Aceptar'
              onClick={handleAccept}
              containerStyle={{textTransform: 'none', fontSize: 16}}
            />
          </section>
        </main>
      );
    }

    if (method === 'card' && cardRow) {
      return (
        <main
          className='scrollable'
          style={{
            padding: 20,
            paddingBottom: 28,
            backgroundColor: APP_PALETTE.appShell,
            minHeight: 'calc(100vh - 120px)',
            boxSizing: 'border-box',
          }}
        >
          <components.Container containerStyle={{...checkoutCardStyle}}>
            <div
              className='row-center-space-between'
              style={{marginBottom: 18}}
            >
              <h5 style={{color: 'var(--text-on-light)', margin: 0}}>
                {cardRow.name}
              </h5>
              <div style={radioOuter(true)} className='center'>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: APP_PALETTE.accent,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                height: 1,
                backgroundColor: 'var(--border-color)',
                marginBottom: 18,
              }}
            />
            <p
              className='t14'
              style={{margin: '0 0 8px', color: 'var(--text-on-light)'}}
            >
              Número de tarjeta
            </p>
            <p
              className='t16'
              style={{
                margin: 0,
                color: 'var(--text-on-light)',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              {cardRow.number}
            </p>
          </components.Container>
          <section style={{paddingTop: 28}}>
            <components.Button
              text='Aceptar'
              onClick={handleAccept}
              containerStyle={{textTransform: 'none', fontSize: 16}}
            />
          </section>
        </main>
      );
    }

    return null;
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
