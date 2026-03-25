import React, {useCallback, useEffect, useRef, useState} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {resetCart} from '../store/slices/cartSlice';
import {
  setCheckoutShippingOptionPick,
  setCheckoutShippingQuoteBundle,
  setCheckoutShippingSelection,
} from '../store/slices/paymentSlice';
import {supabase} from '../supabaseClient';
import type {UserAddressRow} from '../types/address';
import {formatAddressLine} from '../utils/formatAddressLine';
import {
  createOrderFromCheckout,
  type OrderPaymentMetadata,
} from '../utils/createOrder';
import {
  getCheckoutPaymentLabel,
  isCheckoutPaymentSelectionReady,
} from '../utils/checkoutPaymentLabel';
import {notifyOrderEmail} from '../utils/orderEmailNotify';
import {generateClientOrderNumber} from '../utils/orderNumber';
import {chargeSavedCard, fetchStripePublishableKey} from '../utils/stripeCardClient';
import {
  confirmBnplRedirect,
  createBnplPaymentIntent,
  type BnplProvider,
} from '../utils/stripeBnplClient';
import {writeBnplReturnStored} from '../utils/bnplReturnStorage';
import {
  getCartCheckoutTotals,
  resolveCheckoutShippingUsd,
} from '../utils/cartPaymentTotals';
import {fetchShippingQuoteResult} from '../utils/shippingQuoteClient';

const checkoutCardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
};

export const Checkout: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  hooks.useThemeColor(APP_PALETTE.appShell);

  const cart = useSelector((state: RootState) => state.cartSlice);
  const checkoutShippingUsd = useSelector(
    (state: RootState) => state.paymentSlice.checkoutShippingUsd,
  );
  const checkoutPaymentSelection = useSelector(
    (state: RootState) => state.paymentSlice.checkoutPaymentSelection,
  );
  const shippingAddressLine = useSelector(
    (state: RootState) => state.paymentSlice.address,
  );
  const checkoutShippingAddressId = useSelector(
    (state: RootState) => state.paymentSlice.checkoutShippingAddressId,
  );
  const checkoutShippingOptions = useSelector(
    (state: RootState) => state.paymentSlice.checkoutShippingOptions,
  );
  const checkoutShippingOptionId = useSelector(
    (state: RootState) => state.paymentSlice.checkoutShippingOptionId,
  );
  /** Misma cifra que la fila elegida (importe + tax al cambiar método). */
  const shippingUsdResolved = resolveCheckoutShippingUsd({
    storedUsd: checkoutShippingUsd,
    options: checkoutShippingOptions,
    selectedId: checkoutShippingOptionId,
  });
  const checkoutTotals = getCartCheckoutTotals(cart, shippingUsdResolved);

  /** Evita que al remontar Checkout tras elegir envío se pierda la opción (antes se forzaba la más barata). */
  const checkoutShippingOptionIdRef = useRef<string | null>(null);
  checkoutShippingOptionIdRef.current = checkoutShippingOptionId;

  useEffect(() => {
    if (!checkoutShippingOptionId) {
      return;
    }
    if (shippingUsdResolved == null || checkoutShippingUsd == null) {
      return;
    }
    const resolvedCents = Math.round(shippingUsdResolved * 100);
    const storedCents = Math.round(checkoutShippingUsd * 100);
    if (resolvedCents !== storedCents) {
      dispatch(
        setCheckoutShippingOptionPick({
          id: checkoutShippingOptionId,
          usd: shippingUsdResolved,
        }),
      );
    }
  }, [
    checkoutShippingOptionId,
    checkoutShippingUsd,
    dispatch,
    shippingUsdResolved,
  ]);

  const paymentMethodLabel = getCheckoutPaymentLabel(checkoutPaymentSelection);
  const isZellePayment = checkoutPaymentSelection?.kind === 'zelle';
  const isBnplPayment =
    checkoutPaymentSelection?.kind === 'installments' &&
    Boolean(checkoutPaymentSelection.installmentsProvider);

  const [showZellePaymentDialog, setShowZellePaymentDialog] = useState(false);
  const [showBnplRedirectDialog, setShowBnplRedirectDialog] = useState(false);
  const [showBnplOpeningOverlay, setShowBnplOpeningOverlay] = useState(false);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [showProcessingPayment, setShowProcessingPayment] = useState(false);
  /** Avisos y errores en modal (sin `alert()` del navegador). */
  const [checkoutNotice, setCheckoutNotice] = useState<{
    title: string;
    message: string;
    afterClose?: () => void;
  } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  /** Primera dirección guardada por defecto si el usuario ya inició sesión y aún no hay elección. */
  useEffect(() => {
    if (checkoutShippingAddressId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      if (!supabase) {
        return;
      }
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (!session?.user || cancelled) {
        return;
      }
      const {data, error} = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', {ascending: false})
        .limit(1);
      if (cancelled || error || !data?.length) {
        return;
      }
      const row = data[0] as UserAddressRow;
      dispatch(
        setCheckoutShippingSelection({
          addressId: row.id,
          formattedLine: formatAddressLine(row),
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [checkoutShippingAddressId, dispatch]);

  useEffect(() => {
    if (!checkoutShippingAddressId) {
      dispatch(setCheckoutShippingQuoteBundle(null));
      return;
    }
    const lines = cart.list
      .map((item) => ({
        product_id: String(item.id),
        quantity: item.quantity ?? 1,
      }))
      .filter((line) => line.quantity > 0);
    if (!lines.length) {
      dispatch(setCheckoutShippingQuoteBundle(null));
      return;
    }
    let cancelled = false;
    setShippingQuoteLoading(true);
    (async () => {
      const result = await fetchShippingQuoteResult({
        shippingAddressId: checkoutShippingAddressId,
        lines,
        promoCode: cart.promoCode?.trim() || null,
      });
      if (cancelled) {
        return;
      }
      setShippingQuoteLoading(false);
      if (!result.ok) {
        dispatch(setCheckoutShippingQuoteBundle(null));
        return;
      }
      const opts = result.options;
      const prevId = checkoutShippingOptionIdRef.current;
      const prevStillValid =
        Boolean(prevId) && opts.some((o) => o.id === prevId);
      const picked = prevStillValid
        ? opts.find((o) => o.id === prevId)!
        : opts[0];
      dispatch(
        setCheckoutShippingQuoteBundle({
          usd: picked ? picked.amount_cents / 100 : result.usd,
          options: opts,
          selectedOptionId: picked?.id ?? null,
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [cart.list, cart.promoCode, checkoutShippingAddressId, dispatch]);

  useEffect(() => {
    if (!showZellePaymentDialog) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showZellePaymentDialog]);

  useEffect(() => {
    if (!showBnplRedirectDialog) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showBnplRedirectDialog]);

  useEffect(() => {
    if (!checkoutNotice) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [checkoutNotice]);

  useEffect(() => {
    if (!showBnplOpeningOverlay) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showBnplOpeningOverlay]);

  /** Dirección elegida pero cotización pendiente o fallida: no mostrar total final ni cobrar. */
  const checkoutShippingBlocked = Boolean(
    checkoutShippingAddressId &&
      (shippingQuoteLoading || shippingUsdResolved === null),
  );
  const orderSummaryTotalLabel =
    checkoutShippingBlocked
      ? shippingQuoteLoading
        ? '…'
        : '—'
      : `$${checkoutTotals.grandTotal.toFixed(2)}`;

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Checkout'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderOrderSummary = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 8}}
      >
        <components.Container containerStyle={checkoutCardStyle}>
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 20,
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <h6 style={{color: 'var(--text-on-light)'}}>My order</h6>
            <h6 style={{color: 'var(--text-on-light)'}}>
              {orderSummaryTotalLabel}
            </h6>
          </div>
          {/* Products (miniatura + texto, como en el resto de la plantilla) */}
          {cart.list.map(
            (product: ProductType, index: number, array: ProductType[]) => {
              const isLast = index === array.length - 1;
              return (
                <div
                  key={product.id}
                  className='row-center-space-between'
                  style={{
                    marginBottom: isLast ? 10 : 12,
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div
                    className='row-center'
                    style={{minWidth: 0, flex: 1, gap: 12, alignItems: 'center'}}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        flexShrink: 0,
                        backgroundColor: 'var(--image-background)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <img
                        src={product.image}
                        alt=''
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    <span
                      className='t14'
                      style={{
                        color: 'var(--text-on-light)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {product.name}
                    </span>
                  </div>
                  <span
                    className='t14'
                    style={{
                      color: 'var(--text-on-light)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.quantity} x ${product.price}
                  </span>
                </div>
              );
            },
          )}
          {/* Subtotal = merchandise (line items) before coupon, shipping, processing */}
          <div
            className='row-center-space-between'
            style={{marginBottom: 6}}
          >
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Subtotal
            </span>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              ${cart.subtotal.toFixed(2)}
            </span>
          </div>
          {cart.discountAmount > 0.005 ? (
            <div
              className='row-center-space-between'
              style={{marginBottom: 6}}
            >
              <span className='t14' style={{color: 'var(--text-on-light)'}}>
                {cart.promoCode?.trim()
                  ? `Discount (${cart.promoCode.trim()})`
                  : 'Discount'}
              </span>
              <span className='t14' style={{color: 'var(--text-on-light)'}}>
                -${cart.discountAmount.toFixed(2)}
              </span>
            </div>
          ) : null}
          {/* Delivery */}
          <div
            className='row-center-space-between'
            style={{marginBottom: 6}}
          >
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Delivery
            </span>
            <span
              className='t14'
              style={{
                color:
                  checkoutShippingAddressId &&
                  !shippingQuoteLoading &&
                  shippingUsdResolved !== null &&
                  shippingUsdResolved <= 0
                    ? '#00824B'
                    : 'var(--text-on-light)',
              }}
            >
              {!checkoutShippingAddressId
                ? '—'
                : shippingQuoteLoading
                  ? '…'
                  : shippingUsdResolved === null
                    ? '—'
                    : shippingUsdResolved <= 0
                      ? 'Free'
                      : `$${shippingUsdResolved.toFixed(2)}`}
            </span>
          </div>
          <div className='row-center-space-between'>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Tax
            </span>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              ${checkoutTotals.processingTax.toFixed(2)}
            </span>
          </div>
        </components.Container>
      </section>
    );
  };

  const renderShippingDetails = (): JSX.Element => {
    return (
      <section
        className='container clickable'
        style={{marginBottom: 8}}
      >
        <components.Container
          containerStyle={checkoutCardStyle}
          onContainerClick={() => {
            navigate(Routes.CheckoutShippingDetails);
          }}
        >
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <h5 style={{color: 'var(--text-on-light)'}}>Shipping details</h5>
            <svg.RightArrowSvg />
          </div>

          <span
            className='t14'
            style={{
              color: 'var(--text-on-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {shippingAddressLine.trim()
              ? shippingAddressLine
              : 'Select a shipping address'}
          </span>
        </components.Container>
      </section>
    );
  };

  const renderShippingMethod = (): JSX.Element | null => {
    if (!checkoutShippingAddressId) {
      return null;
    }
    const selectedOpt = checkoutShippingOptions?.find(
      (o) => o.id === checkoutShippingOptionId,
    );
    const methodSummary = shippingQuoteLoading
      ? '…'
      : shippingUsdResolved === null
        ? '—'
        : selectedOpt
          ? `${selectedOpt.label} — ${
              selectedOpt.amount_cents <= 0
                ? 'Free'
                : `$${(selectedOpt.amount_cents / 100).toFixed(2)}`
            }`
          : checkoutShippingOptions?.length
            ? 'Select shipping method'
            : '—';
    const canOpen =
      Boolean(checkoutShippingOptions?.length) && !checkoutShippingBlocked;

    return (
      <section
        className='container clickable'
        style={{marginBottom: 8}}
      >
        <components.Container
          containerStyle={checkoutCardStyle}
          onContainerClick={() => {
            if (!canOpen) {
              return;
            }
            navigate(Routes.CheckoutShippingMethod);
          }}
        >
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <h5 style={{color: 'var(--text-on-light)'}}>Shipping method</h5>
            {canOpen ? <svg.RightArrowSvg /> : null}
          </div>

          <span
            className='t14'
            style={{
              color: 'var(--text-on-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {methodSummary}
          </span>
        </components.Container>
      </section>
    );
  };

  const renderPaymentMethod = (): JSX.Element => {
    return (
      <section
        className='container clickable'
        style={{marginBottom: 8}}
      >
        <components.Container
          containerStyle={checkoutCardStyle}
          onContainerClick={() => {
            navigate(Routes.CheckoutPaymentMethod);
          }}
        >
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <h5 style={{color: 'var(--text-on-light)'}}>Payment method</h5>
            <svg.RightArrowSvg />
          </div>

          <span className='t14' style={{color: 'var(--text-on-light)'}}>
            {paymentMethodLabel}
          </span>
        </components.Container>
      </section>
    );
  };

  const renderComment = (): JSX.Element => {
    return (
      <section className='container'>
        <textarea
          placeholder='Enter your comment'
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: APP_PALETTE.cartCardSurface,
            color: 'var(--text-on-light)',
            padding: 20,
            width: '100%',
            height: 130,
            resize: 'none',
            borderRadius: 0,
          }}
          className='t16'
        />
      </section>
    );
  };

  const startBnplCheckout = useCallback(async () => {
    if (!supabase) {
      setShowBnplOpeningOverlay(false);
      return;
    }
    if (checkoutSubmitting) {
      return;
    }
    const provider = checkoutPaymentSelection?.installmentsProvider as
      | BnplProvider
      | undefined;
    if (!provider || (provider !== 'affirm' && provider !== 'klarna')) {
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Payment method',
        message: 'Choose Affirm or Klarna in payment methods.',
        afterClose: () => navigate(Routes.CheckoutInstallmentsPick),
      });
      return;
    }

    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setShowBnplOpeningOverlay(false);
      navigate(Routes.SignIn);
      return;
    }

    if (!checkoutShippingAddressId || !shippingAddressLine.trim()) {
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Shipping address',
        message: 'Please choose a shipping address.',
        afterClose: () => navigate(Routes.CheckoutShippingDetails),
      });
      return;
    }

    if (shippingQuoteLoading || shippingUsdResolved === null) {
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Shipping',
        message: shippingQuoteLoading
          ? 'Calculating shipping…'
          : 'Could not get shipping for this address. Try again or pick a different address.',
      });
      return;
    }

    const amountCents = Math.round(checkoutTotals.grandTotal * 100);
    if (provider === 'affirm' && amountCents < 5000) {
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Affirm',
        message:
          'Affirm requires a minimum order of $50 USD. Add more items or choose another payment method.',
      });
      return;
    }

    setCheckoutSubmitting(true);

    const {data: addrRow, error: addrErr} = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', checkoutShippingAddressId)
      .maybeSingle();

    if (addrErr || !addrRow) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Shipping address',
        message: 'Could not load your shipping address. Try again in a moment.',
      });
      return;
    }
    const addr = addrRow as UserAddressRow;

    const {data: prof} = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', session.user.id)
      .maybeSingle();

    const email =
      (prof?.email as string | null)?.trim() ||
      session.user.email?.trim() ||
      '';
    const name =
      (prof?.full_name as string | null)?.trim() ||
      session.user.email?.split('@')[0] ||
      'Customer';

    if (!email) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Email required',
        message:
          'Your account needs an email to use installment checkout. Update your profile and try again.',
        afterClose: () => navigate(Routes.EditProfile),
      });
      return;
    }

    const stripeAddr = {
      line1: (addr.street ?? '').trim() || '—',
      city: (addr.municipality ?? '').trim() || '—',
      state: (addr.state_code ?? '').trim() || '—',
      postal_code: (addr.zip ?? '').trim() || '00000',
      country: (addr.country_iso2 ?? 'US').toUpperCase().slice(0, 2) || 'US',
    };

    const humanOrderNumber = generateClientOrderNumber();

    const intent = await createBnplPaymentIntent({
      provider,
      amountCents,
      currency: 'usd',
      orderRef: humanOrderNumber,
      shippingAddressId: checkoutShippingAddressId,
    });

    if (!intent.ok) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      const msg =
        intent.error === 'affirm_minimum_usd_50'
          ? 'Affirm requires a minimum order of $50 USD.'
          : intent.error;
      setCheckoutNotice({
        title: 'Payment',
        message: msg,
      });
      return;
    }

    /**
     * Snapshot completo antes del redirect: tras la navegación a Affirm/Klarna y
     * el retorno, Redux se reinicia (carrito vacío, estado de pago perdido).
     * sessionStorage persiste mientras la pestaña siga abierta.
     */
    writeBnplReturnStored({
      orderRef: humanOrderNumber,
      paymentIntentId: intent.paymentIntentId,
      cart,
      paymentSelection: checkoutPaymentSelection as import('../store/slices/paymentSlice').CheckoutPaymentSelection,
      shippingAddressId: checkoutShippingAddressId,
      shippingAddressLine: shippingAddressLine.trim(),
      shippingUsd: shippingUsdResolved,
    });

    const cfg = await fetchStripePublishableKey();
    if (!cfg.ok) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Payment',
        message: cfg.error,
      });
      return;
    }

    const stripe = await loadStripe(cfg.publishableKey);
    if (!stripe) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Payment',
        message: 'Stripe could not load. Check your connection and try again.',
      });
      return;
    }

    const returnUrlObj = new URL(
      `${window.location.origin}${Routes.CheckoutBnplReturn}`,
    );
    returnUrlObj.searchParams.set('order_ref', humanOrderNumber);
    returnUrlObj.searchParams.set('pi_hint', intent.paymentIntentId);
    const returnUrl = returnUrlObj.toString();

    const confirm = await confirmBnplRedirect({
      stripe,
      clientSecret: intent.clientSecret,
      provider,
      returnUrl,
      billingDetails: {
        email,
        name,
        address: stripeAddr,
      },
      shipping: {
        name,
        address: stripeAddr,
      },
    });

    if (!confirm.ok) {
      setCheckoutSubmitting(false);
      setShowBnplOpeningOverlay(false);
      setCheckoutNotice({
        title: 'Payment',
        message: confirm.error,
      });
      return;
    }
    /* Success: Stripe redirects to the provider; keep overlay until navigation. */
  }, [
    cart,
    checkoutPaymentSelection,
    checkoutShippingAddressId,
    checkoutSubmitting,
    checkoutTotals.grandTotal,
    navigate,
    shippingAddressLine,
    shippingQuoteLoading,
    shippingUsdResolved,
  ]);

  const goToOrderSuccess = async () => {
    if (checkoutPaymentSelection?.kind === 'installments') {
      return;
    }

    if (!isCheckoutPaymentSelectionReady(checkoutPaymentSelection)) {
      setCheckoutNotice({
        title: 'Payment method',
        message: 'Please select a payment method before confirming your order.',
        afterClose: () => navigate(Routes.CheckoutPaymentMethod),
      });
      return;
    }

    const humanOrderNumber = generateClientOrderNumber();
    const heroImageUrl = cart.list[0]?.image ?? '';
    const productImageUrls = cart.list
      .map((p) => p.image)
      .filter((u) => typeof u === 'string' && u.length > 0);

    if (!supabase) {
      navigate(Routes.OrderSuccessful, {
        state: {orderNumber: humanOrderNumber, heroImageUrl, productImageUrls},
      });
      return;
    }

    const {
      data: {session},
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate(Routes.SignIn);
      return;
    }

    if (!checkoutShippingAddressId || !shippingAddressLine.trim()) {
      setCheckoutNotice({
        title: 'Shipping address',
        message: 'Please choose a shipping address.',
        afterClose: () => navigate(Routes.CheckoutShippingDetails),
      });
      return;
    }

    if (shippingQuoteLoading || shippingUsdResolved === null) {
      setCheckoutNotice({
        title: 'Shipping',
        message: shippingQuoteLoading
          ? 'Calculating shipping…'
          : 'Could not get shipping for this address. Try again or pick a different address.',
      });
      return;
    }

    setCheckoutSubmitting(true);

    let stripePaymentIntentId: string | undefined;
    let stripeChargeId: string | undefined;

    // Tarjeta: cobrar en Stripe primero, luego crear orden si el pago fue exitoso.
    if (checkoutPaymentSelection?.kind === 'card') {
      const paymentMethodId = String(checkoutPaymentSelection.cardId ?? '').trim();
      if (!paymentMethodId.startsWith('pm_')) {
        setCheckoutSubmitting(false);
        navigate(Routes.OrderFailed, {state: {reason: 'No valid card selected.'}});
        return;
      }
      setShowProcessingPayment(true);
      const minWait = new Promise((resolve) => window.setTimeout(resolve, 4000));
      const chargePromise = chargeSavedCard({
        paymentMethodId,
        amountCents: Math.round(checkoutTotals.grandTotal * 100),
        currency: 'usd',
        orderRef: humanOrderNumber,
      });
      const [, chargeResult] = await Promise.all([minWait, chargePromise]);
      setShowProcessingPayment(false);
      if (!chargeResult.ok) {
        setCheckoutSubmitting(false);
        const reason = chargeResult.error || 'Payment declined';
        navigate(Routes.OrderFailed, {state: {reason}});
        return;
      }
      stripePaymentIntentId = chargeResult.paymentIntentId;
      if (chargeResult.chargeId) {
        stripeChargeId = chargeResult.chargeId;
      }
    }

    const paymentMethodDisplay = getCheckoutPaymentLabel(checkoutPaymentSelection);
    const paymentMetadata: OrderPaymentMetadata = {
      payment_method_display: paymentMethodDisplay,
      ...(stripePaymentIntentId
        ? {stripe_payment_intent_id: stripePaymentIntentId}
        : {}),
      ...(stripeChargeId ? {stripe_charge_id: stripeChargeId} : {}),
    };

    const {orderId, error} = await createOrderFromCheckout({
      userId: session.user.id,
      cart,
      checkoutPaymentSelection,
      humanOrderNumber,
      shippingAddressId: checkoutShippingAddressId,
      shippingAddressLine: shippingAddressLine.trim(),
      paymentMetadata,
      shippingUsd: shippingUsdResolved,
    });
    setCheckoutSubmitting(false);

    if (error) {
      setCheckoutSubmitting(false);
      setCheckoutNotice({
        title: 'Order',
        message: error.message,
      });
      return;
    }

    if (orderId) {
      void notifyOrderEmail({orderId, reason: 'created'});
    }

    dispatch(resetCart());
    navigate(Routes.OrderSuccessful, {
      state: {
        orderNumber: humanOrderNumber,
        orderId: orderId ?? undefined,
        heroImageUrl,
        productImageUrls,
      },
    });
  };

  const handleConfirmOrderClick = () => {
    if (checkoutSubmitting) {
      return;
    }
    if (!isCheckoutPaymentSelectionReady(checkoutPaymentSelection)) {
      setCheckoutNotice({
        title: 'Payment method',
        message: 'Please select a payment method before confirming your order.',
        afterClose: () => navigate(Routes.CheckoutPaymentMethod),
      });
      return;
    }
    if (checkoutShippingAddressId && (shippingQuoteLoading || shippingUsdResolved === null)) {
      setCheckoutNotice({
        title: 'Shipping',
        message: shippingQuoteLoading
          ? 'Calculating shipping…'
          : 'Could not get shipping for this address. Try again or pick a different address.',
      });
      return;
    }
    if (isZellePayment) {
      setShowZellePaymentDialog(true);
      return;
    }
    if (isBnplPayment) {
      setShowBnplRedirectDialog(true);
      return;
    }
    void goToOrderSuccess();
  };

  const handleZelleDialogContinue = () => {
    if (checkoutSubmitting) {
      return;
    }
    setShowZellePaymentDialog(false);
    void goToOrderSuccess();
  };

  const handleBnplRedirectContinue = () => {
    if (checkoutSubmitting) {
      return;
    }
    setShowBnplRedirectDialog(false);
    setShowBnplOpeningOverlay(true);
    void startBnplCheckout();
  };

  const bnplProviderLabel =
    checkoutPaymentSelection?.installmentsProvider === 'klarna'
      ? 'Klarna'
      : 'Affirm';

  const renderBnplRedirectDialog = (): JSX.Element | null => {
    if (!showBnplRedirectDialog) {
      return null;
    }

    return (
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='bnpl-redirect-dialog-title'
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.cartCardSurface,
            padding: '24px 22px 20px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <h2
            id='bnpl-redirect-dialog-title'
            style={{
              margin: '0 0 14px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            Continue with {bnplProviderLabel}
          </h2>
          <div
            className='t14'
            style={{
              margin: 0,
              marginBottom: 14,
              color: 'var(--text-on-light)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            <p style={{margin: '0 0 12px'}}>
              You will be redirected away from our store to{' '}
              <strong>{bnplProviderLabel}</strong> to complete your payment
              securely.
            </p>
            <p style={{margin: 0}}>
              Once finished, you will return to our store to finalize your order.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <components.Button
              text='Continue'
              onClick={handleBnplRedirectContinue}
              containerStyle={{
                textTransform: 'none',
                fontSize: 16,
                width: '100%',
                maxWidth: 280,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderZellePaymentDialog = (): JSX.Element | null => {
    if (!showZellePaymentDialog) {
      return null;
    }

    return (
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='zelle-payment-dialog-title'
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4000,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.cartCardSurface,
            padding: '24px 22px 20px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <h2
            id='zelle-payment-dialog-title'
            style={{
              margin: '0 0 14px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            Zelle payment notice
          </h2>
          <div
            className='t14'
            style={{
              margin: 0,
              marginBottom: 14,
              color: 'var(--text-on-light)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            <p style={{margin: '0 0 12px'}}>
              You have selected <strong>Zelle</strong> as your payment method.
            </p>
            <p style={{margin: '0 0 12px'}}>
              Your order will be created in <strong>Pending payment</strong>{' '}
              status. Once we confirm your Zelle payment, the status will change
              to <strong>Order created</strong>.
            </p>
            <p style={{margin: 0}}>
              If we do not receive your payment via Zelle within{' '}
              <strong>72 hours</strong>, your order will be{' '}
              <strong>automatically cancelled</strong> for non-payment.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <components.Button
              text='Continue'
              onClick={handleZelleDialogContinue}
              containerStyle={{
                textTransform: 'none',
                fontSize: 16,
                width: '100%',
                maxWidth: 280,
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCheckoutNoticeDialog = (): JSX.Element | null => {
    if (!checkoutNotice) {
      return null;
    }

    const close = () => {
      const fn = checkoutNotice.afterClose;
      setCheckoutNotice(null);
      fn?.();
    };

    return (
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='checkout-notice-title'
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4100,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.cartCardSurface,
            padding: '24px 22px 20px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <h2
            id='checkout-notice-title'
            style={{
              margin: '0 0 14px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            {checkoutNotice.title}
          </h2>
          <p
            className='t14'
            style={{
              margin: '0 0 18px',
              color: 'var(--text-on-light)',
              lineHeight: 1.55,
              textAlign: 'center',
              wordBreak: 'break-word',
            }}
          >
            {checkoutNotice.message}
          </p>
          <components.Button
            text='OK'
            onClick={close}
            containerStyle={{
              textTransform: 'none',
              fontSize: 16,
              width: '100%',
              maxWidth: 280,
            }}
          />
        </div>
      </div>
    );
  };

  const renderFooter = (): JSX.Element => {
    return (
      <section
        style={{
          padding: 20,
          paddingBottom: 28,
          backgroundColor: APP_PALETTE.appShell,
        }}
      >
        <components.Button
          text={
            checkoutSubmitting
              ? isBnplPayment
                ? 'Opening application…'
                : 'Placing order…'
              : isBnplPayment
                ? `Continue application (${orderSummaryTotalLabel})`
                : `Confirm order (${orderSummaryTotalLabel})`
          }
          onClick={handleConfirmOrderClick}
          containerStyle={{
            opacity:
              checkoutSubmitting || checkoutShippingBlocked ? 0.75 : 1,
            pointerEvents:
              checkoutSubmitting || checkoutShippingBlocked ? 'none' : 'auto',
          }}
        />
      </section>
    );
  };

  const renderCandleLoadingOverlay = (
    visible: boolean,
    title: string,
    subtitle: string,
  ): JSX.Element | null => {
    if (!visible) {
      return null;
    }
    return (
      <div
        role='dialog'
        aria-modal='true'
        aria-busy='true'
        aria-live='polite'
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5000,
          backgroundColor: 'rgba(0, 0, 0, 0.58)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            borderRadius: 14,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.cartCardSurface,
            padding: '26px 22px 22px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 58,
              height: 58,
              margin: '0 auto 16px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 38,
                borderRadius: '10px 10px 6px 6px',
                background: '#F1B97F',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 36,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 2,
                height: 8,
                background: '#3D2A20',
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 42,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 18,
                borderRadius: '70% 70% 60% 60%',
                background: 'radial-gradient(circle at 50% 70%, #F1B97F 0%, #F18B2A 65%, #D86A0E 100%)',
                animation: 'candle-flame-flicker 1.1s ease-in-out infinite',
              }}
            />
          </div>
          <p
            className='t16'
            style={{
              margin: 0,
              color: '#1C2D18',
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {title}
          </p>
          <p
            className='t14'
            style={{margin: '8px 0 0', color: APP_PALETTE.priceMuted, lineHeight: 1.5}}
          >
            {subtitle}
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
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        {renderOrderSummary()}
        {renderShippingDetails()}
        {renderShippingMethod()}
        {renderPaymentMethod()}
        {renderComment()}
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
      {renderZellePaymentDialog()}
      {renderBnplRedirectDialog()}
      {renderCheckoutNoticeDialog()}
      {renderCandleLoadingOverlay(
        showProcessingPayment,
        'Processing payment...',
        'This may take a few seconds.',
      )}
      {renderCandleLoadingOverlay(
        showBnplOpeningOverlay,
        `Taking you to ${bnplProviderLabel}…`,
        'Please wait while we connect you securely.',
      )}
      <style>{`
        @keyframes candle-flame-flicker {
          0% { transform: translateX(-50%) scale(1) rotate(0deg); opacity: 0.95; }
          50% { transform: translateX(-50%) scale(1.08) rotate(-2deg); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.98) rotate(1deg); opacity: 0.92; }
        }
      `}</style>
    </>
  );
};
