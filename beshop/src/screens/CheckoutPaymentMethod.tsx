import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {svg} from '../assets/svg';
import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {APP_PALETTE} from '../theme/appPalette';
import type {StripeSavedCard} from '../types/shop';
import type {
  CheckoutPaymentDetailState,
  ShopPaymentSettingsRow,
} from '../types/shop';
import {RootState} from '../store';
import {setCheckoutPaymentSelection} from '../store/slices/paymentSlice';
import {listStripeSavedCards} from '../utils/stripeCardClient';

const checkoutCardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
};

export const CheckoutPaymentMethod: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const checkoutPaymentSelection = useSelector(
    (s: RootState) => s.paymentSlice.checkoutPaymentSelection,
  );

  const [paymentSettings, setPaymentSettings] =
    useState<ShopPaymentSettingsRow | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const [savedCards, setSavedCards] = useState<StripeSavedCard[]>([]);
  const [cardsReady, setCardsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [cardsLoadError, setCardsLoadError] = useState<string | null>(null);

  const zelleEnabled =
    settingsReady && Boolean(supabase) && paymentSettings?.zelle_enabled === true;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (
      checkoutPaymentSelection?.kind === 'card' &&
      checkoutPaymentSelection.cardId &&
      !String(checkoutPaymentSelection.cardId).startsWith('pm_')
    ) {
      dispatch(setCheckoutPaymentSelection(null));
    }
  }, [checkoutPaymentSelection, dispatch]);

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase) {
        setHasSession(false);
        setCardsLoadError(null);
        setSavedCards([]);
        setCardsReady(true);
        return;
      }
      const {data} = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (!data.session) {
        setHasSession(false);
        setCardsLoadError(null);
        setSavedCards([]);
        setCardsReady(true);
        return;
      }
      setHasSession(true);
      const r = await listStripeSavedCards();
      if (cancelled) {
        return;
      }
      if (r.ok) {
        setSavedCards((r.cards ?? []) as StripeSavedCard[]);
        setCardsLoadError(null);
      } else {
        setSavedCards([]);
        setCardsLoadError(r.error);
      }
      setCardsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goDetail = (state: CheckoutPaymentDetailState) => {
    navigate(Routes.CheckoutPaymentDetail, {state});
  };

  const goAddCard = () => {
    navigate(Routes.AddANewCard, {
      state: {returnTo: Routes.CheckoutPaymentMethod},
    });
  };

  const checkoutCards = savedCards.map((c) => ({
    id: c.id,
    label: `${(c.brand || 'Card').toUpperCase()} •••• ${c.last4}`,
  }));

  const rowButtonStyle: React.CSSProperties = {
    padding: '14px 16px',
    marginBottom: 10,
    width: '100%',
    borderRadius: 8,
    border: `1px solid ${APP_PALETTE.border}`,
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
          {!cardsReady ? (
            <p className='t14' style={{color: 'var(--text-on-light)'}}>
              Loading cards...
            </p>
          ) : cardsLoadError ? (
            <p className='t14' style={{color: 'var(--text-on-light)'}}>
              Could not load your cards. Try again in a moment.
            </p>
          ) : !hasSession ? (
            <>
              <p
                className='t14'
                style={{
                  color: 'var(--text-on-light)',
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                Inicia sesión para pagar con una tarjeta guardada de forma segura.
              </p>
              <components.Button
                text='Ir a iniciar sesión'
                onClick={() => navigate(Routes.SignIn)}
                containerStyle={{textTransform: 'none', fontSize: 16}}
              />
            </>
          ) : checkoutCards.length === 0 ? (
            <>
              <p
                className='t14'
                style={{
                  color: 'var(--text-on-light)',
                  lineHeight: 1.5,
                  marginBottom: 18,
                }}
              >
                No tienes tarjetas guardadas. Añade una con el botón de abajo.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingBottom: 4,
                }}
              >
                <button
                  type='button'
                  className='clickable'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    borderRadius: 999,
                    border: `1px dashed ${APP_PALETTE.border}`,
                    backgroundColor: 'transparent',
                  }}
                  onClick={goAddCard}
                  aria-label='Add a new card'
                >
                  <span style={{color: APP_PALETTE.accent}}>
                    <svg.AddANewCardSvg />
                  </span>
                </button>
                <p
                  className='t12'
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    color: 'var(--text-on-light)',
                    opacity: 0.85,
                    textAlign: 'center',
                  }}
                >
                  Add a new card
                </p>
              </div>
            </>
          ) : checkoutCards.map((card, index, array) => {
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
                  goDetail({
                    method: 'card',
                    cardId: String(card.id),
                    cardLabel: card.label,
                  })
                }
                className='row-center-space-between'
              >
                <span className='t14' style={{color: 'var(--text-on-light)'}}>
                  {card.label}
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
          onClick={() => navigate(Routes.CheckoutInstallmentsPick)}
        >
          <h5 style={{color: 'var(--text-on-light)', margin: 0}}>
            Pay in installments
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
