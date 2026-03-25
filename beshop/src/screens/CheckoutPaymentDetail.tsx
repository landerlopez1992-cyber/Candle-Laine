import React, {useCallback, useEffect, useState} from 'react';

import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {setCheckoutPaymentSelection} from '../store/slices/paymentSlice';
import {APP_PALETTE} from '../theme/appPalette';
import {bnplLogoUrl} from '../config/paymentLogos';
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
  const cardLabel = rawState?.cardLabel;
  const installmentsProvider = rawState?.installmentsProvider;

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
    if (!cardId) {
      navigate(Routes.CheckoutPaymentMethod, {replace: true});
      return;
    }
    if (!String(cardId).startsWith('pm_')) {
      navigate(Routes.CheckoutPaymentMethod, {replace: true});
    }
  }, [method, cardId, navigate]);

  useEffect(() => {
    if (method !== 'installments') {
      return;
    }
    if (!installmentsProvider) {
      navigate(Routes.CheckoutInstallmentsPick, {replace: true});
    }
  }, [method, installmentsProvider, navigate]);

  const handleAccept = useCallback(() => {
    if (!method) {
      return;
    }
    if (method === 'card') {
      if (!cardId) {
        return;
      }
      dispatch(
        setCheckoutPaymentSelection({
          kind: 'card',
          cardId,
          ...(cardLabel?.trim() ? {cardLabel: cardLabel.trim()} : {}),
        }),
      );
    } else if (method === 'installments') {
      if (!installmentsProvider) {
        return;
      }
      dispatch(
        setCheckoutPaymentSelection({
          kind: 'installments',
          installmentsProvider,
        }),
      );
    } else {
      dispatch(setCheckoutPaymentSelection({kind: method}));
    }
    navigate(Routes.Checkout);
  }, [method, cardId, cardLabel, installmentsProvider, dispatch, navigate]);

  if (!method) {
    return null;
  }

  const headerTitle =
    method === 'zelle'
      ? 'Zelle'
      : method === 'installments' && installmentsProvider === 'affirm'
        ? 'Affirm'
        : method === 'installments' && installmentsProvider === 'klarna'
          ? 'Klarna'
          : method === 'installments'
            ? 'Pay in installments'
            : cardLabel?.trim()
              ? cardLabel.trim()
              : 'Card';

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
    if (method === 'card' && !cardId) {
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
            Loading…
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
              Send payment to:
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
                : 'Zelle phone or email will be configured soon.'}
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
              text='Accept'
              onClick={handleAccept}
              containerStyle={{textTransform: 'none', fontSize: 16}}
            />
          </section>
        </main>
      );
    }

    if (method === 'installments' && installmentsProvider) {
      const label = installmentsProvider === 'affirm' ? 'Affirm' : 'Klarna';
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
              <div
                className='row-center'
                style={{gap: 10, minWidth: 0, flex: 1, marginRight: 8}}
              >
                <img
                  src={bnplLogoUrl(installmentsProvider)}
                  alt=''
                  aria-hidden
                  style={{
                    height: 24,
                    width: 'auto',
                    maxWidth: 72,
                    maxHeight: 26,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
                <h5 style={{color: 'var(--text-on-light)', margin: 0}}>{label}</h5>
              </div>
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
              On checkout, tap <strong>Continue application</strong> to open{' '}
              {label}&apos;s secure flow. After you finish, you&apos;ll return here
              and we&apos;ll create your order if the payment succeeds.
            </p>
            {installmentsProvider === 'affirm' ? (
              <p
                className='t12'
                style={{
                  margin: '14px 0 0',
                  color: 'var(--text-on-light)',
                  opacity: 0.9,
                  lineHeight: 1.5,
                }}
              >
                For some purchases, Affirm may require a minimum amount (often $50
                USD).
              </p>
            ) : (
              <p
                className='t12'
                style={{
                  margin: '14px 0 0',
                  color: 'var(--text-on-light)',
                  opacity: 0.9,
                  lineHeight: 1.5,
                }}
              >
                Available options can vary depending on your region.
              </p>
            )}
          </components.Container>
          <section style={{paddingTop: 28}}>
            <components.Button
              text='Accept'
              onClick={handleAccept}
              containerStyle={{textTransform: 'none', fontSize: 16}}
            />
          </section>
        </main>
      );
    }

    if (method === 'card' && cardId) {
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
                {cardLabel?.trim() || 'Card'}
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
              Card number
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
              {cardLabel?.trim() || '•••• •••• •••• ••••'}
            </p>
          </components.Container>
          <section style={{paddingTop: 28}}>
            <components.Button
              text='Accept'
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
