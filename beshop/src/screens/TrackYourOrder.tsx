import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {supabase} from '../supabaseClient';
import type {OrderRowDb} from '../utils/orderMap';
import {mapOrderRowToOrderType, SUPABASE_ORDER_SELECT} from '../utils/orderMap';

type LocationState = {orderId?: string};

export const TrackYourOrder: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();

  const orderId = (location.state as LocationState | null)?.orderId;

  const [order, setOrder] = useState<OrderRowDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!orderId || !supabase) {
      setLoading(false);
      setOrder(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) {
          setError('Sign in to track your order');
          setLoading(false);
        }
        return;
      }
      const {data, error: qError} = await supabase
        .from('orders')
        .select(SUPABASE_ORDER_SELECT)
        .eq('id', orderId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }
      if (qError || !data) {
        setError(qError?.message ?? 'Order not found');
        setOrder(null);
      } else {
        setOrder(data as OrderRowDb);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const mapped = order ? mapOrderRowToOrderType(order) : null;
  const lineImages =
    mapped?.products
      .map((p) => p.image?.trim())
      .filter((u): u is string => Boolean(u)) ?? [];

  const st = order?.status;

  const renderTimeline = (): JSX.Element | null => {
    if (!order || !mapped) {
      return null;
    }

    if (st === 'cancelled') {
      return (
        <p
          className='t16'
          style={{color: APP_PALETTE.textMuted, textAlign: 'center'}}
        >
          This order has been cancelled.
        </p>
      );
    }

    if (st === 'pending_payment') {
      return (
        <>
          <components.OrderStatus
            confirmed={true}
            status='Order created'
            description='We have received your order'
          />
          <components.OrderStatus
            currentStatus={true}
            status='Pending payment'
            description='Awaiting Zelle payment within 72 hours'
          />
          <components.OrderStatus
            status='Order processing'
            description='We will prepare your order after payment is confirmed'
          />
          <components.OrderStatus
            status='Shipping'
            description='Your order will ship after confirmation'
          />
        </>
      );
    }

    if (st === 'paid') {
      return (
        <>
          <components.OrderStatus
            confirmed={true}
            status='Order created'
            description='We have received your order'
          />
          <components.OrderStatus
            confirmed={true}
            status='Payment confirmed'
            description='Your Zelle payment has been confirmed'
          />
          <components.OrderStatus
            currentStatus={true}
            status='Order processing'
            description='We are preparing your order'
          />
          <components.OrderStatus
            status='Shipping'
            description='Your order will ship soon'
          />
        </>
      );
    }

    if (st === 'created') {
      return (
        <>
          <components.OrderStatus
            confirmed={true}
            status='Order created'
            description='We have received your order'
          />
          <components.OrderStatus
            confirmed={true}
            status='Order confirmed'
            description='Your order has been confirmed'
          />
          <components.OrderStatus
            currentStatus={true}
            status='Order processing'
            description='We are preparing your order'
          />
          <components.OrderStatus
            status='Shipping'
            description='Your order will ship soon'
          />
        </>
      );
    }

    if (st === 'processing') {
      return (
        <>
          <components.OrderStatus
            confirmed={true}
            status='Order created'
            description='We have received your order'
          />
          <components.OrderStatus
            confirmed={true}
            status='Order confirmed'
            description='Your order has been confirmed'
          />
          <components.OrderStatus
            currentStatus={true}
            status='Order shipping'
            description='We are preparing your shipment'
          />
          <components.OrderStatus
            status='Courier delivering'
            description='Your package is on the way'
          />
        </>
      );
    }

    if (st === 'shipped') {
      return (
        <>
          <components.OrderStatus
            confirmed={true}
            status='Order created'
            description='We have received your order'
          />
          <components.OrderStatus
            confirmed={true}
            status='Order confirmed'
            description='Your order has been confirmed'
          />
          <components.OrderStatus
            confirmed={true}
            status='Order shipping'
            description='We have shipped your order'
          />
          <components.OrderStatus
            currentStatus={true}
            status='Delivered'
            description='Your order has been delivered'
          />
        </>
      );
    }

    return null;
  };

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <main
          className='scrollable'
          style={{backgroundColor: APP_PALETTE.appShell, minHeight: 200}}
        >
          <components.Loader />
        </main>
      );
    }

    if (!orderId) {
      return (
        <main
          className='scrollable container'
          style={{backgroundColor: APP_PALETTE.appShell}}
        >
          <p className='t16' style={{color: APP_PALETTE.textOnDark}}>
            Open an order from Order History to track it.
          </p>
          <components.Button
            text='Order history'
            onClick={() => navigate(Routes.OrderHistory)}
            containerStyle={{marginTop: 16}}
          />
        </main>
      );
    }

    if (error || !order || !mapped) {
      return (
        <main
          className='scrollable container'
          style={{backgroundColor: APP_PALETTE.appShell}}
        >
          <p className='t16' style={{color: APP_PALETTE.textMuted}}>
            {error ?? 'Order not found'}
          </p>
        </main>
      );
    }

    return (
      <main
        className='scrollable'
        style={{
          paddingTop: 17,
          paddingBottom: 20,
          backgroundColor: APP_PALETTE.appShell,
        }}
      >
        {lineImages.length > 0 ? (
          <>
            <img
              src={lineImages[0]}
              alt=''
              style={{
                width: '60%',
                maxWidth: 280,
                height: 'auto',
                alignSelf: 'center',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: lineImages.length > 1 ? 14 : 30,
                display: 'block',
                objectFit: 'contain',
                borderRadius: 8,
                backgroundColor: 'var(--image-background)',
              }}
            />
            {lineImages.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  justifyContent: 'center',
                  marginBottom: 30,
                  paddingLeft: 16,
                  paddingRight: 16,
                  boxSizing: 'border-box',
                }}
              >
                {lineImages.slice(1).map((src, i) => (
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt=''
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--image-background)',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p
            className='t14'
            style={{
              textAlign: 'center',
              color: APP_PALETTE.textMuted,
              marginBottom: 28,
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            No product photos are linked to this order yet.
          </p>
        )}
        <h3
          style={{
            textAlign: 'center',
            marginBottom: 4,
            textTransform: 'capitalize',
            color: APP_PALETTE.textOnDark,
          }}
        >
          Your order:
        </h3>
        <span
          className='t16'
          style={{
            textAlign: 'center',
            display: 'block',
            marginBottom: 20,
            color: APP_PALETTE.textOnDark,
          }}
        >
          #{mapped.humanNumber}
        </span>
        {renderTimeline()}
      </main>
    );
  };

  return (
    <>
      <components.Header
        showGoBack={true}
        title='Track Your Order'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
      {renderContent()}
    </>
  );
};
