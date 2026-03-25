import React, {useEffect, useMemo} from 'react';

import {OrderCelebration} from '../components/OrderCelebration';
import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {generateClientOrderNumber} from '../utils/orderNumber';

const FALLBACK_HERO =
  'https://george-fx.github.io/beshop_api/assets/other/07.png';

type OrderSuccessfulState = {
  orderNumber?: string;
  orderId?: string;
  heroImageUrl?: string;
  /** Fotos de los productos del pedido (fondo difuminado). */
  productImageUrls?: string[];
};

/** Icono de corazón verde en círculo (mismo patrón que HeartBigSvg de la plantilla). */
const OrderSuccessGreenLikeIcon: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={52}
      height={52}
      fill='none'
      aria-hidden
      style={{display: 'block', margin: '0 auto 18px'}}
    >
      <rect
        width={51}
        height={51}
        x={0.5}
        y={0.5}
        stroke='var(--border-color)'
        rx={25.5}
      />
      <path
        fill={APP_PALETTE.accentJade}
        d='M32.367 18.842a4.584 4.584 0 0 0-6.484 0l-.883.883-.883-.883a4.584 4.584 0 0 0-6.484 6.483l.884.883L25 32.692l6.483-6.484.884-.883a4.582 4.582 0 0 0 0-6.483Z'
      />
    </svg>
  );
};

function ProductPhotosBackdrop({urls}: {urls: string[]}): JSX.Element {
  const tiles = useMemo(() => {
    const u = urls.filter(Boolean);
    if (u.length === 0) {
      return [FALLBACK_HERO, FALLBACK_HERO, FALLBACK_HERO, FALLBACK_HERO];
    }
    if (u.length >= 4) {
      return u.slice(0, 4);
    }
    const out: string[] = [...u];
    while (out.length < 4) {
      out.push(u[out.length % u.length]);
    }
    return out;
  }, [urls]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {tiles.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=''
          style={{
            position: 'absolute',
            width: '55%',
            height: '55%',
            objectFit: 'cover',
            top: i < 2 ? '-5%' : '45%',
            left: i % 2 === 0 ? '-5%' : '45%',
            filter: 'blur(14px)',
            transform: 'scale(1.08)',
            opacity: 0.85,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            180deg,
            rgba(28, 45, 24, 0.82) 0%,
            ${APP_PALETTE.appShell}f0 45%,
            ${APP_PALETTE.appShell} 100%
          )`,
        }}
      />
    </div>
  );
}

export const OrderSuccessful: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const location = hooks.useLocation();

  hooks.useThemeColor(APP_PALETTE.appShell);

  const navState = location.state as OrderSuccessfulState | null;
  const orderNumberFromNav = navState?.orderNumber;
  const heroImageUrl = navState?.heroImageUrl;
  const productImageUrls = navState?.productImageUrls ?? [];

  const orderNumber = useMemo(
    () => orderNumberFromNav ?? generateClientOrderNumber(),
    [orderNumberFromNav],
  );

  const heroSrc =
    heroImageUrl ||
    productImageUrls[0] ||
    FALLBACK_HERO;

  const backdropUrls = useMemo(
    () =>
      productImageUrls.length > 0 ? productImageUrls : [heroSrc, FALLBACK_HERO],
    [productImageUrls, heroSrc],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
    dispatch(actions.resetCart());
  }, [dispatch]);

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable container center'
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: 24,
          paddingBottom: 32,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            padding: '20px 18px 24px',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(28, 45, 24, 0.72)',
            border: `1px solid ${APP_PALETTE.border}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <OrderSuccessGreenLikeIcon />
          <img
            src={heroSrc}
            alt=''
            style={{
              width: '80%',
              maxHeight: 220,
              height: 'auto',
              alignSelf: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 24,
              display: 'block',
              objectFit: 'contain',
              borderRadius: 8,
              backgroundColor: 'var(--image-background)',
            }}
          />
          <h2
            style={{
              textTransform: 'capitalize',
              marginBottom: 10,
              textAlign: 'center',
              color: APP_PALETTE.textOnDark,
            }}
          >
            Order created!
          </h2>
          <p
            className='t14'
            style={{
              textAlign: 'center',
              marginBottom: 8,
              color: APP_PALETTE.textMuted,
              letterSpacing: '0.02em',
            }}
          >
            Your order number
          </p>
          <p
            className='t18'
            style={{
              textAlign: 'center',
              marginBottom: 22,
              fontWeight: 700,
              color: APP_PALETTE.textOnDark,
              letterSpacing: '0.04em',
              fontFamily: 'League Spartan, sans-serif',
            }}
          >
            {orderNumber}
          </p>
          <p
            className='t16'
            style={{
              textAlign: 'center',
              marginBottom: 28,
              lineHeight: 1.55,
              color: APP_PALETTE.textMuted,
            }}
          >
            Your order will be delivered on time.
            <br />
            Thank you!
          </p>
          <components.Button
            text='View orders'
            to={Routes.OrderHistory}
            containerStyle={{width: '100%', marginBottom: 10}}
          />
          <components.Button
            text='Continue Shopping'
            colorScheme='secondary'
            to={Routes.TabNavigator}
            containerStyle={{width: '100%'}}
          />
        </div>
      </main>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: APP_PALETTE.appShell,
      }}
    >
      <ProductPhotosBackdrop urls={backdropUrls} />
      <div style={{position: 'relative', zIndex: 1}}>
        <OrderCelebration />
      </div>
      {renderContent()}
    </div>
  );
};
