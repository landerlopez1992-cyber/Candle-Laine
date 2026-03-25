import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Swiper, SwiperSlide} from 'swiper/react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {supabase} from '../supabaseClient';
import type {StripeSavedCard} from '../types/shop';
import {deleteStripeSavedCard, listStripeSavedCards} from '../utils/stripeCardClient';

const cards = [
  {
    id: 1,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/01.png',
  },
  {
    id: 2,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/02.png',
  },
  {
    id: 3,
    image: 'https://george-fx.github.io/beshop_api/assets/cards/03.png',
  },
];

export const PaymentMethod: React.FC = () => {
  const dispatch = hooks.useDispatch();
  hooks.useThemeColor(APP_PALETTE.appShell);

  const navigate = hooks.useNavigate();
  const location = useLocation();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [savedCards, setSavedCards] = useState<StripeSavedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [pendingDeleteCardId, setPendingDeleteCardId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (location.pathname !== Routes.PaymentMethod) {
      return;
    }
    let cancelled = false;
    void (async () => {
      if (!supabase) {
        if (!cancelled) {
          setSessionChecked(true);
          setLoggedIn(false);
        }
        return;
      }
      const {data} = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      const ok = Boolean(data.session);
      setLoggedIn(ok);
      setSessionChecked(true);
      if (!ok) {
        setSavedCards([]);
        return;
      }
      setCardsLoading(true);
      const r = await listStripeSavedCards();
      if (cancelled) {
        return;
      }
      setCardsLoading(false);
      if (r.ok) {
        setSavedCards(r.cards ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.key]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Payment Method'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  /** Tarjetas guardadas en Stripe (sesión) o carrusel demo (invitado). */
  const renderCards = (): JSX.Element => {
    return (
      <div style={{marginBottom: 24}}>
        <div
          style={{
            marginLeft: 20,
            marginRight: 20,
            paddingBottom: 10,
            marginBottom: 16,
            borderBottom: `2px solid ${APP_PALETTE.border}`,
          }}
        >
          <h5
            style={{
              margin: 0,
              marginBottom: 0,
              color: APP_PALETTE.textOnDark,
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Cards
          </h5>
        </div>

        <div style={{width: '100%'}}>
          {!sessionChecked ? (
            <p className='t14' style={{marginLeft: 20, color: APP_PALETTE.textMuted}}>
              Cargando…
            </p>
          ) : cardsLoading ? (
            <p className='t14' style={{marginLeft: 20, color: APP_PALETTE.textMuted}}>
              Cargando tarjetas…
            </p>
          ) : loggedIn && savedCards.length > 0 ? (
            <Swiper
              spaceBetween={14}
              slidesPerView={'auto'}
              pagination={{clickable: true}}
              navigation={true}
              mousewheel={true}
            >
              {savedCards.map((c, index, array) => {
                const isLast = index === array.length - 1;
                const brand = (c.brand || 'Card').toUpperCase();
                const holder = (c.holder_name || 'CARD HOLDER').trim().toUpperCase();
                const backgrounds = [
                  'linear-gradient(135deg, #C04C79 0%, #A24266 60%, #8D3758 100%)',
                  'linear-gradient(135deg, #A7CFA6 0%, #84B282 60%, #5C8A5A 100%)',
                  'linear-gradient(135deg, #6F7FA7 0%, #586A93 60%, #45567A 100%)',
                ];
                const cardBg = backgrounds[index % backgrounds.length];
                return (
                  <SwiperSlide key={c.id} style={{width: 'auto'}}>
                    <div
                      style={{
                        width: 279,
                        minHeight: 168,
                        borderRadius: 10,
                        marginRight: isLast ? 20 : 0,
                        marginLeft: index === 0 ? 20 : 0,
                        border: `1px solid ${APP_PALETTE.border}`,
                        position: 'relative',
                        overflow: 'hidden',
                        background: cardBg,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: -30,
                          top: -16,
                          width: 160,
                          height: 160,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 42,
                          top: 18,
                          width: 120,
                          height: 120,
                          transform: 'rotate(42deg)',
                          borderRadius: 28,
                          background: 'rgba(255,255,255,0.06)',
                        }}
                      />
                      <button
                        type='button'
                        onClick={() => {
                          if (deleteBusyId) {
                            return;
                          }
                          setPendingDeleteCardId(c.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          zIndex: 2,
                          borderRadius: 999,
                          border: 'none',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          color: '#fff',
                          fontFamily: 'Lato, sans-serif',
                          fontSize: 11,
                          cursor: deleteBusyId === c.id ? 'wait' : 'pointer',
                        }}
                      >
                        {deleteBusyId === c.id ? '...' : 'Eliminar'}
                      </button>
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          minHeight: 168,
                        }}
                      >
                      <p
                        className='t12'
                        style={{
                          margin: 0,
                          marginBottom: 8,
                          color: '#ffffff',
                          fontFamily: 'Lato, sans-serif',
                          letterSpacing: 0.5,
                          fontWeight: 700,
                        }}
                      >
                        {brand}
                      </p>
                      <p
                        className='t16'
                        style={{
                          margin: 0,
                          marginBottom: 6,
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                          fontSize: 18,
                        }}
                      >
                        •••• •••• •••• {c.last4}
                      </p>
                      <p className='t12' style={{margin: 0, color: '#ffffff'}}>
                        Exp{' '}
                        {c.exp_month > 0
                          ? String(c.exp_month).padStart(2, '0')
                          : '--'}
                        /
                        {c.exp_year > 0 ? String(c.exp_year).slice(-2) : '--'}
                      </p>
                      <p
                        className='t11'
                        style={{
                          margin: '8px 0 0',
                          color: '#ffffff',
                          opacity: 0.92,
                          letterSpacing: 0.4,
                        }}
                      >
                        {holder}
                      </p>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          ) : loggedIn && savedCards.length === 0 ? (
            <p
              className='t14'
              style={{
                marginLeft: 20,
                marginRight: 20,
                color: APP_PALETTE.textMuted,
                lineHeight: 1.5,
              }}
            >
              No tienes tarjetas guardadas. Añade una con el botón de abajo.
            </p>
          ) : (
            <Swiper
              spaceBetween={14}
              slidesPerView={'auto'}
              pagination={{clickable: true}}
              navigation={true}
              mousewheel={true}
            >
              {cards.map((product: any, index: number, array: any[]) => {
                const isLast = index === array.length - 1;
                return (
                  <SwiperSlide
                    key={product.id}
                    style={{width: 'auto'}}
                  >
                    <img
                      alt='card'
                      src={product.image}
                      style={{
                        width: 279,
                        borderRadius: 10,
                        marginRight: isLast ? 20 : 0,
                        marginLeft: index === 0 ? 20 : 0,
                      }}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
      </div>
    );
  };

  /** Apple Pay / Pay Pal / Payoneer ocultos por decisión de producto (solo tarjetas + añadir). */
  const renderAddNewCard = (): JSX.Element => {
    return (
      <div
        className='container'
        style={{
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            paddingBottom: 8,
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
            onClick={() => {
              navigate(Routes.AddANewCard);
            }}
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
              color: APP_PALETTE.textMuted,
              textAlign: 'center',
            }}
          >
            Add a new card
          </p>
        </div>
      </div>
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          paddingTop: 16,
          paddingBottom: 28,
          backgroundColor: APP_PALETTE.appShell,
        }}
      >
        {renderCards()}
        {renderAddNewCard()}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {pendingDeleteCardId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 12,
              border: `1px solid ${APP_PALETTE.border}`,
              backgroundColor: APP_PALETTE.cartCardSurface,
              padding: 18,
            }}
          >
            <p
              className='t16'
              style={{margin: 0, marginBottom: 6, color: '#1C2D18', fontWeight: 700}}
            >
              Eliminar tarjeta
            </p>
            <p className='t14' style={{margin: 0, marginBottom: 16, color: APP_PALETTE.priceMuted}}>
              Esta acción quitará la tarjeta guardada de tu cuenta.
            </p>
            <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
              <button
                type='button'
                onClick={() => setPendingDeleteCardId(null)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: `1px solid ${APP_PALETTE.border}`,
                  background: 'transparent',
                  color: APP_PALETTE.priceMuted,
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type='button'
                onClick={() => {
                  if (!pendingDeleteCardId) {
                    return;
                  }
                  setDeleteBusyId(pendingDeleteCardId);
                  void deleteStripeSavedCard(pendingDeleteCardId).then((r) => {
                    setDeleteBusyId(null);
                    if (r.ok) {
                      setSavedCards((prev) => prev.filter((x) => x.id !== pendingDeleteCardId));
                    }
                    setPendingDeleteCardId(null);
                  });
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: `1px solid ${APP_PALETTE.accent}`,
                  background: APP_PALETTE.accent,
                  color: '#1C2D18',
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: deleteBusyId ? 'wait' : 'pointer',
                }}
              >
                {deleteBusyId ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
