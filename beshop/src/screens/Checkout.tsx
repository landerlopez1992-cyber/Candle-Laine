import React, {useEffect, useState} from 'react';
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
import {supabase} from '../supabaseClient';
import {createOrderFromCheckout} from '../utils/createOrder';
import {getCheckoutPaymentLabel} from '../utils/checkoutPaymentLabel';
import {generateClientOrderNumber} from '../utils/orderNumber';

const checkoutCardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
};

export const Checkout: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  hooks.useThemeColor(APP_PALETTE.appShell);

  const cart = useSelector((state: RootState) => state.cartSlice);
  const checkoutPaymentSelection = useSelector(
    (state: RootState) => state.paymentSlice.checkoutPaymentSelection,
  );
  const paymentMethodLabel = getCheckoutPaymentLabel(checkoutPaymentSelection);
  const isZellePayment = checkoutPaymentSelection?.kind === 'zelle';

  const [showZellePaymentDialog, setShowZellePaymentDialog] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

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
              ${cart.total.toFixed(2)}
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
          {/* Discount */}
          <div
            className='row-center-space-between'
            style={{marginBottom: 6}}
          >
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Discount
            </span>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              -${cart.discount}
            </span>
          </div>
          {/* Delivery */}
          <div className='row-center-space-between'>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Delivery
            </span>
            <span
              className='t14'
              style={{color: '#00824B'}}
            >
              Free
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

          <span className='t14' style={{color: 'var(--text-on-light)'}}>
            8000 S Kirkland Ave, Chicago, IL 6065...
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

  const goToOrderSuccess = async () => {
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

    setCheckoutSubmitting(true);
    const {orderId, error} = await createOrderFromCheckout({
      userId: session.user.id,
      cart,
      checkoutPaymentSelection,
      humanOrderNumber,
    });
    setCheckoutSubmitting(false);

    if (error) {
      alert(error.message);
      return;
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
    if (isZellePayment) {
      setShowZellePaymentDialog(true);
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
              ? 'Placing order…'
              : `Confirm order ($${cart.total.toFixed(2)})`
          }
          onClick={handleConfirmOrderClick}
          containerStyle={{
            opacity: checkoutSubmitting ? 0.75 : 1,
            pointerEvents: checkoutSubmitting ? 'none' : 'auto',
          }}
        />
      </section>
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
    </>
  );
};
