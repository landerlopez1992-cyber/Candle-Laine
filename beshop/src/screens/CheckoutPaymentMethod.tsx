import React, {useEffect, useState} from 'react';

import {svg} from '../assets/svg';
import {CHECKOUT_CREDIT_CARDS} from '../constants/checkoutPayment';
import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {APP_PALETTE} from '../theme/appPalette';
import type {
  CheckoutPaymentDetailState,
  ShopPaymentSettingsRow,
} from '../types/shop';

const checkoutCardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
};

export const CheckoutPaymentMethod: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const [paymentSettings, setPaymentSettings] =
    useState<ShopPaymentSettingsRow | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);

  const zelleEnabled =
    settingsReady && Boolean(supabase) && paymentSettings?.zelle_enabled === true;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) {
      setSettingsReady(true);
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
        } else {
          setPaymentSettings(null);
        }
        setSettingsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const goDetail = (state: CheckoutPaymentDetailState) => {
    navigate(Routes.CheckoutPaymentDetail, {state});
  };

  const rowButtonStyle: React.CSSProperties = {
    padding: 20,
    marginBottom: 8,
    width: '100%',
    border: '1px solid var(--border-color)',
    backgroundColor: APP_PALETTE.cartCardSurface,
    cursor: 'pointer',
    textAlign: 'left',
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Payment Method'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
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
          containerStyle={{...checkoutCardStyle, marginBottom: 8}}
        >
          <div
            style={{
              marginBottom: 18,
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <h5 style={{color: 'var(--text-on-light)'}}>Credit Cards</h5>
          </div>
          {CHECKOUT_CREDIT_CARDS.map((card, index, array) => {
            const isLast = index === array.length - 1;

            return (
              <button
                key={card.id}
                type='button'
                style={{
                  padding: '12px 0',
                  marginBottom: isLast ? 0 : 15,
                  width: '100%',
                  border: 'none',
                  borderBottom: isLast
                    ? 'none'
                    : '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
                onClick={() =>
                  goDetail({method: 'card', cardId: String(card.id)})
                }
                className='row-center-space-between'
              >
                <span className='t14' style={{color: 'var(--text-on-light)'}}>
                  {card.number}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.55,
                  }}
                  aria-hidden
                >
                  <svg.RightArrowSvg />
                </span>
              </button>
            );
          })}
        </components.Container>

        <button
          type='button'
          style={{
            ...rowButtonStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
          className='row-center-space-between'
          onClick={() => goDetail({method: 'installments'})}
        >
          <h5 style={{color: 'var(--text-on-light)', margin: 0}}>
            Pagar en cuotas
          </h5>
          <span style={{display: 'flex', opacity: 0.55}} aria-hidden>
            <svg.RightArrowSvg />
          </span>
        </button>

        {zelleEnabled && (
          <button
            type='button'
            style={{
              ...rowButtonStyle,
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
            className='row-center-space-between'
            onClick={() => goDetail({method: 'zelle'})}
          >
            <h5 style={{color: 'var(--text-on-light)', margin: 0}}>Zelle</h5>
            <span style={{display: 'flex', opacity: 0.55}} aria-hidden>
              <svg.RightArrowSvg />
            </span>
          </button>
        )}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
