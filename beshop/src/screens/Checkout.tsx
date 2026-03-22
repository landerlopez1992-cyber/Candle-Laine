import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {ProductType} from '../types';
import {actions} from '../store/actions';
import {components} from '../components';

export const Checkout: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  hooks.useThemeColor('#FCEDEA');

  const cart = useSelector((state: RootState) => state.cartSlice);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Checkout'
        showGoBack={true}
        headerStyle={{backgroundColor: '#FCEDEA'}}
      />
    );
  };

  const renderOrderSummary = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 8}}
      >
        <components.Container>
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 20,
              paddingBottom: 10,
              borderBottom: '2px solid var(--main-color)',
            }}
          >
            <h6>My order</h6>
            <h6>${cart.total.toFixed(2)}</h6>
          </div>
          {/* Products */}
          {cart.list.map(
            (product: ProductType, index: number, array: ProductType[]) => {
              const isLast = index === array.length - 1;
              return (
                <div
                  key={product.id}
                  className='row-center-space-between'
                  style={{marginBottom: isLast ? 6 : 6}}
                >
                  <span className='t14'>{product.name}</span>
                  <span className='t14'>
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
            <span className='t14'>Discount</span>
            <span className='t14'>-${cart.discount}</span>
          </div>
          {/* Delivery */}
          <div className='row-center-space-between'>
            <span className='t14'>Delivery</span>
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
          onContainerClick={() => {
            navigate(Routes.CheckoutShippingDetails);
          }}
        >
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid var(--main-color)',
            }}
          >
            <h5>Shipping details</h5>
            <svg.RightArrowSvg />
          </div>

          <span className='t14'>8000 S Kirkland Ave, Chicago, IL 6065...</span>
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
          onContainerClick={() => {
            navigate(Routes.CheckoutPaymentMethod);
          }}
        >
          <div
            className='row-center-space-between'
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid var(--main-color)',
            }}
          >
            <h5>Payment method</h5>
            <svg.RightArrowSvg />
          </div>

          <span className='t14'>7741 ******** 6644</span>
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
            border: '1px solid #FCEDEA',
            backgroundColor: '#fff',
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

  const renderFooter = (): JSX.Element => {
    return (
      <section
        style={{
          padding: 20,
          backgroundColor: 'var(--white-color)',
        }}
      >
        <components.Button
          to={Routes.OrderSuccessful}
          // to={Routes.OrderFailed}
          text={`Confirm order ($${cart.total.toFixed(2)})`}
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
          paddingBottom: 20,
          backgroundColor: 'var(--white-color)',
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
    </>
  );
};
