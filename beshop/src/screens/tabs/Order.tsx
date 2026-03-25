import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {items} from '../../items';
import {hooks} from '../../hooks';
import {Routes} from '../../enums';
import {custom} from '../../custom';
import {svg} from '../../assets/svg';
import {RootState} from '../../store';
import {ProductType} from '../../types';
import {components} from '../../components';
import {actions} from '../../store/actions';
import {APP_PALETTE} from '../../theme/appPalette';
import {supabase} from '../../supabaseClient';
import {validateAndApplyShopCoupon} from '../../utils/applyShopCoupon';
import {runCouponSuccessConfetti} from '../../utils/runCouponConfetti';
import {getCartCheckoutTotals} from '../../utils/cartPaymentTotals';

export const Order: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [promoInput, setPromoInput] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [promoSuccessToast, setPromoSuccessToast] = useState(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  const cart = useSelector((state: RootState) => state.cartSlice);
  const orderTotals = getCartCheckoutTotals(cart);
  const applied = Boolean(cart.promoCode?.trim());

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Order'
        showBasket={true}
        showGoBack={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderProducts = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 18}}
      >
        {cart.list.map(
          (product: ProductType, index: number, array: ProductType[]) => {
            const isLast = index === array.length - 1;
            return (
              <items.OrderItem
                key={product.id}
                isLast={isLast}
                product={product}
              />
            );
          },
        )}
      </section>
    );
  };

  const onApplyPromo = async () => {
    setApplyError(null);
    if (!supabase) {
      setApplyError('Sign in to apply a coupon.');
      return;
    }
    const {data: auth} = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setApplyError('Sign in to apply a coupon.');
      return;
    }
    setApplyBusy(true);
    const result = await validateAndApplyShopCoupon({
      code: promoInput,
      userId: user.id,
      cart,
    });
    setApplyBusy(false);
    if (!result.ok) {
      setApplyError(result.message);
      return;
    }
    dispatch(actions.setDiscount(result.discountPercent));
    dispatch(actions.setPromoCode(result.codeNormalized));
    setPromoInput('');
    runCouponSuccessConfetti();
    setPromoSuccessToast(true);
    window.setTimeout(() => setPromoSuccessToast(false), 4500);
  };

  const renderPromocode = (): JSX.Element | null => {
    if (applied) {
      return (
        <div
          className='container'
          style={{marginBottom: '14%'}}
        >
          <div
            className='row-center'
            style={{gap: 12, marginBottom: 8}}
          >
            <svg.CheckPromocodeSvg />
            <span
              className='t14'
              style={{color: 'var(--text-color)'}}
            >
              {cart.promoCode}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className='container'
        style={{marginBottom: '14%'}}
      >
        <div
          className='row-center-space-between'
          style={{gap: 10}}
        >
          <custom.InputField
            placeholder='Enter promocode'
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            containerStyle={{width: '66%'}}
          />
          <div style={{width: '34%'}}>
            <components.Button
              text={applyBusy ? '…' : 'Apply'}
              colorScheme='secondary'
              containerStyle={{width: '100%'}}
              onClick={() => void onApplyPromo()}
            />
          </div>
        </div>
        {applyError ? (
          <p
            className='t12'
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: '#c44',
            }}
          >
            {applyError}
          </p>
        ) : null}
      </div>
    );
  };

  const renderSummary = (): JSX.Element => {
    const applied = Boolean(cart.promoCode?.trim());
    const hasPercentOff =
      applied && cart.discount > 0 && cart.discountAmount > 0;
    const freeShippingOnly =
      applied && cart.discount === 0 && cart.discountAmount === 0;

    return (
      <section
        className='container'
        style={{marginBottom: 10}}
      >
        {promoSuccessToast ? (
          <div
            style={{
              marginBottom: 12,
              padding: '12px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(76, 119, 92, 0.28)',
              border: '1px solid rgba(76, 119, 92, 0.45)',
            }}
          >
            <p
              className='t14'
              style={{
                margin: 0,
                textAlign: 'center',
                color: '#1C2D18',
                fontWeight: 600,
              }}
            >
              Coupon added successfully!
            </p>
          </div>
        ) : null}
        <components.Container
          containerStyle={{
            backgroundColor: APP_PALETTE.cartCardSurface,
          }}
        >
          <div
            className='row-center-space-between'
            style={{marginBottom: 9}}
          >
            <span
              className='t14'
              style={{color: 'var(--text-on-light)'}}
            >
              Subtotal
            </span>
            <span
              className='t14'
              style={{color: 'var(--text-on-light)'}}
            >
              ${cart.subtotal.toFixed(2)}
            </span>
          </div>
          {(hasPercentOff || freeShippingOnly) && (
            <div
              className='row-center-space-between'
              style={{marginBottom: 9}}
            >
              <span
                className='t14'
                style={{color: 'var(--text-on-light)'}}
              >
                Discount
              </span>
              <span
                className='t14'
                style={{
                  color: '#00824B',
                  fontWeight: 600,
                }}
              >
                {hasPercentOff
                  ? `-$${cart.discountAmount.toFixed(2)}`
                  : 'Free shipping'}
              </span>
            </div>
          )}
          <div
            className='row-center-space-between'
            style={{marginBottom: 9}}
          >
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Delivery
            </span>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              —
            </span>
          </div>
          <div
            className='row-center-space-between'
            style={{
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
              marginBottom: 10,
            }}
          >
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              Tax
            </span>
            <span className='t14' style={{color: 'var(--text-on-light)'}}>
              ${orderTotals.processingTax.toFixed(2)}
            </span>
          </div>
          <div className='row-center-space-between'>
            <span
              className='t14'
              style={{color: 'var(--text-on-light)'}}
            >
              Total
            </span>
            <span
              className='t14'
              style={{color: 'var(--text-on-light)'}}
            >
              ${orderTotals.grandTotal.toFixed(2)}
            </span>
          </div>
        </components.Container>
      </section>
    );
  };

  const renderButton = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 20}}
      >
        <components.Button
          to={Routes.Checkout}
          text='proceed to checkout'
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
        {renderProducts()}
        {renderPromocode()}
        {renderSummary()}
        {renderButton()}
      </main>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </>
  );
};
