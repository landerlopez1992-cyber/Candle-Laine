import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {RootState} from '../store';
import {setCheckoutShippingOptionPick} from '../store/slices/paymentSlice';
import type {CheckoutShippingOption} from '../store/slices/paymentSlice';
import {
  SHIPPING_LOGO_PATHS,
  type ShippingCarrierUi,
} from '../config/shippingLogos';

const rowButtonStyle: React.CSSProperties = {
  padding: '12px 14px',
  marginBottom: 10,
  width: '100%',
  maxWidth: '100%',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  cursor: 'pointer',
  textAlign: 'left',
};

const rowsWrapStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 320,
  marginLeft: 'auto',
  marginRight: 'auto',
};

function carrierForOption(o: CheckoutShippingOption): ShippingCarrierUi {
  if (o.carrier === 'usps' || o.carrier === 'ups' || o.carrier === 'estimate') {
    return o.carrier;
  }
  if (o.id.startsWith('usps_')) {
    return 'usps';
  }
  if (o.id.startsWith('ups_')) {
    return 'ups';
  }
  return 'estimate';
}

export const CheckoutShippingMethod: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const options = useSelector(
    (s: RootState) => s.paymentSlice.checkoutShippingOptions,
  );
  const selectedId = useSelector(
    (s: RootState) => s.paymentSlice.checkoutShippingOptionId,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!options?.length) {
      navigate(Routes.Checkout, {replace: true});
    }
  }, [navigate, options?.length]);

  const onPick = (id: string, amountCents: number) => {
    dispatch(
      setCheckoutShippingOptionPick({
        id,
        usd: amountCents / 100,
      }),
    );
    navigate(Routes.Checkout);
  };

  if (!options?.length) {
    return null;
  }

  return (
    <>
      <components.Header
        showGoBack={true}
        title='Shipping method'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
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
        <p
          className='t14'
          style={{
            color: APP_PALETTE.textMuted,
            marginBottom: 16,
            lineHeight: 1.55,
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Choose a USPS service. Rates come from the USPS Prices API when
          credentials are configured in Supabase.
        </p>

        <div style={rowsWrapStyle}>
          {options.map((o) => {
            const active = o.id === selectedId;
            const priceLabel =
              o.amount_cents <= 0 ? 'Free' : `$${(o.amount_cents / 100).toFixed(2)}`;
            const carrier = carrierForOption(o);
            return (
              <button
                key={o.id}
                type='button'
                style={{
                  ...rowButtonStyle,
                  borderColor: active ? 'var(--accent-color)' : APP_PALETTE.border,
                }}
                className='row-center-space-between'
                onClick={() => onPick(o.id, o.amount_cents)}
              >
                <div
                  className='row-center'
                  style={{
                    flex: 1,
                    minWidth: 0,
                    gap: 10,
                    alignItems: 'center',
                    paddingRight: 10,
                  }}
                >
                  <img
                    src={SHIPPING_LOGO_PATHS[carrier]}
                    alt=''
                    width={28}
                    height={28}
                    style={{flexShrink: 0, objectFit: 'contain'}}
                  />
                  <span
                    className='t14'
                    style={{
                      color: 'var(--text-on-light)',
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {o.label}
                  </span>
                </div>
                <span
                  className='t14'
                  style={{
                    color:
                      o.amount_cents <= 0 ? '#00824B' : 'var(--text-on-light)',
                    flexShrink: 0,
                    fontWeight: 600,
                  }}
                >
                  {priceLabel}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </>
  );
};
