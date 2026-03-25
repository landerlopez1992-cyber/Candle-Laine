import React, {useEffect, useRef} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {RootState} from '../store';
import {resetCart} from '../store/slices/cartSlice';
import {supabase} from '../supabaseClient';
import {
  createOrderFromCheckout,
  type OrderPaymentMetadata,
} from '../utils/createOrder';
import {getCheckoutPaymentLabel} from '../utils/checkoutPaymentLabel';
import {fetchStripePublishableKey} from '../utils/stripeCardClient';
import {
  clearBnplReturnStored,
  readBnplReturnStored,
} from '../utils/bnplReturnStorage';
import {notifyOrderEmail} from '../utils/orderEmailNotify';

/**
 * Stripe redirige aquí tras Klarna/Affirm (`return_url`).
 * Query típica: `payment_intent_client_secret`, `redirect_status`, `payment_intent`.
 * Al volver de Affirm/Klarna, Redux está vacío (carrito y estado de pago reiniciados).
 * Por eso leemos el snapshot completo guardado en sessionStorage antes del redirect.
 */
export const CheckoutBnplReturn: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const doneRef = useRef(false);

  const reduxCart = useSelector((s: RootState) => s.cartSlice);
  const reduxPaymentSelection = useSelector(
    (s: RootState) => s.paymentSlice.checkoutPaymentSelection,
  );
  const reduxShippingAddressLine = useSelector(
    (s: RootState) => s.paymentSlice.address,
  );
  const reduxShippingAddressId = useSelector(
    (s: RootState) => s.paymentSlice.checkoutShippingAddressId,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (doneRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const clientSecret = params.get('payment_intent_client_secret');
    const redirectStatus = params.get('redirect_status');
    const orderRefFromUrl = String(params.get('order_ref') ?? '').trim();
    const paymentIntentHint = String(
      params.get('payment_intent') ?? params.get('pi_hint') ?? '',
    ).trim();

    if (!clientSecret) {
      doneRef.current = true;
      navigate(Routes.OrderFailed, {
        replace: true,
        state: {reason: 'Missing payment confirmation from provider.'},
      });
      return;
    }

    if (redirectStatus === 'failed') {
      doneRef.current = true;
      navigate(Routes.OrderFailed, {
        replace: true,
        state: {
          reason:
            'Installment payment was declined or cancelled. You can try again or choose another method.',
        },
      });
      return;
    }

    void (async () => {
      if (!supabase) {
        doneRef.current = true;
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: 'App not configured.'},
        });
        return;
      }

      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session?.user) {
        doneRef.current = true;
        navigate(Routes.SignIn, {replace: true});
        return;
      }

      const cfg = await fetchStripePublishableKey();
      if (!cfg.ok) {
        doneRef.current = true;
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: cfg.error},
        });
        return;
      }

      const stripe = await loadStripe(cfg.publishableKey);
      if (!stripe) {
        doneRef.current = true;
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: 'Stripe could not load.'},
        });
        return;
      }

      const {paymentIntent} = await stripe.retrievePaymentIntent(clientSecret);
      const pi = paymentIntent as
        | {
            id: string;
            status: string;
            metadata?: Record<string, string>;
            last_payment_error?: {message?: string};
            latest_charge?: string | {id?: string} | null;
          }
        | null
        | undefined;

      if (!pi) {
        doneRef.current = true;
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: 'Could not verify payment.'},
        });
        return;
      }

      /* --- Resolver order_ref desde metadata o desde el snapshot guardado --- */
      const fromMeta = String(
        (pi.metadata as Record<string, string> | undefined)?.order_ref ?? '',
      ).trim();
      const stored = readBnplReturnStored();
      const storedMatchesPi = Boolean(
        stored &&
          (stored.paymentIntentId === pi.id ||
            (paymentIntentHint && stored.paymentIntentId === paymentIntentHint)),
      );
      const storedSnapshot = storedMatchesPi && stored ? stored : null;
      const orderRef =
        fromMeta ||
        orderRefFromUrl ||
        (storedSnapshot ? storedSnapshot.orderRef.trim() : '');

      if (!orderRef) {
        doneRef.current = true;
        clearBnplReturnStored();
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {
            reason:
              'Could not match this payment to your order. If you were charged, contact support with your email.',
          },
        });
        return;
      }

      if (pi.status !== 'succeeded') {
        doneRef.current = true;
        const msg =
          pi.last_payment_error?.message ||
          (pi.status === 'processing'
            ? 'Payment is still processing. Check your email or order history shortly.'
            : `Payment status: ${pi.status}`);
        clearBnplReturnStored();
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: msg},
        });
        return;
      }

      /* --- Usar snapshot guardado si Redux está vacío (navegación completa) --- */
      const cart =
        reduxCart.list.length > 0
          ? reduxCart
          : storedSnapshot
            ? storedSnapshot.cart
            : reduxCart;
      const checkoutPaymentSelection =
        reduxPaymentSelection ??
        (storedSnapshot ? storedSnapshot.paymentSelection : null);
      const shippingAddressId =
        reduxShippingAddressId ??
        (storedSnapshot ? storedSnapshot.shippingAddressId : null);
      const shippingAddressLine =
        reduxShippingAddressLine.trim() ||
        (storedSnapshot ? storedSnapshot.shippingAddressLine : '');

      const {data: existing} = await supabase
        .from('orders')
        .select('id')
        .eq('human_order_number', orderRef)
        .maybeSingle();

      const heroImageUrl = cart.list[0]?.image ?? '';
      const productImageUrls = cart.list
        .map((p) => p.image)
        .filter((u) => typeof u === 'string' && u.length > 0);

      if (existing?.id) {
        doneRef.current = true;
        clearBnplReturnStored();
        dispatch(resetCart());
        navigate(Routes.OrderSuccessful, {
          replace: true,
          state: {
            orderNumber: orderRef,
            orderId: existing.id as string,
            heroImageUrl,
            productImageUrls,
          },
        });
        return;
      }

      if (!cart.list.length) {
        doneRef.current = true;
        clearBnplReturnStored();
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {
            reason: `Payment may have succeeded but your cart data could not be recovered. Reference: ${orderRef}. Please contact support.`,
          },
        });
        return;
      }

      if (!shippingAddressId || !shippingAddressLine.trim()) {
        doneRef.current = true;
        clearBnplReturnStored();
        navigate(Routes.Checkout, {
          replace: true,
        });
        return;
      }

      const chargeId =
        typeof pi.latest_charge === 'string'
          ? pi.latest_charge
          : (pi.latest_charge as {id?: string} | null)?.id ?? '';

      const paymentMethodDisplay = getCheckoutPaymentLabel(checkoutPaymentSelection);
      const paymentMetadata: OrderPaymentMetadata = {
        payment_method_display: paymentMethodDisplay || 'Installments',
        stripe_payment_intent_id: pi.id,
        ...(chargeId ? {stripe_charge_id: chargeId} : {}),
      };

      const {orderId, error} = await createOrderFromCheckout({
        userId: session.user.id,
        cart,
        checkoutPaymentSelection,
        humanOrderNumber: orderRef,
        shippingAddressId,
        shippingAddressLine: shippingAddressLine.trim(),
        paymentMetadata,
        shippingUsd: storedSnapshot?.shippingUsd ?? 0,
      });

      doneRef.current = true;

      if (error) {
        const {data: dup} = await supabase
          .from('orders')
          .select('id')
          .eq('human_order_number', orderRef)
          .maybeSingle();
        if (dup?.id) {
          clearBnplReturnStored();
          dispatch(resetCart());
          navigate(Routes.OrderSuccessful, {
            replace: true,
            state: {
              orderNumber: orderRef,
              orderId: dup.id as string,
              heroImageUrl,
              productImageUrls,
            },
          });
          return;
        }
        clearBnplReturnStored();
        navigate(Routes.OrderFailed, {
          replace: true,
          state: {reason: error.message},
        });
        return;
      }

      if (orderId) {
        void notifyOrderEmail({orderId, reason: 'created'});
      }

      clearBnplReturnStored();
      dispatch(resetCart());
      navigate(Routes.OrderSuccessful, {
        replace: true,
        state: {
          orderNumber: orderRef,
          orderId: orderId ?? undefined,
          heroImageUrl,
          productImageUrls,
        },
      });
    })();
  }, [
    reduxCart,
    reduxPaymentSelection,
    reduxShippingAddressId,
    dispatch,
    navigate,
    reduxShippingAddressLine,
  ]);

  return (
    <>
      <components.Header
        title='Payment'
        showGoBack={false}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
      <main
        className='scrollable container'
        style={{
          paddingTop: 48,
          minHeight: '50vh',
          backgroundColor: APP_PALETTE.appShell,
        }}
      >
        <components.Loader />
        <p className='t14' style={{color: APP_PALETTE.textMuted, marginTop: 20}}>
          Confirming your installment payment…
        </p>
      </main>
    </>
  );
};
