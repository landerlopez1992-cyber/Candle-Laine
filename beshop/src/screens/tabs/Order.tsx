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
import { APP_PALETTE } from '../../theme/appPalette';

export const Order: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [promocodeApplied, setPromocodeApplied] = useState<boolean>(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  const cart = useSelector((state: RootState) => state.cartSlice);

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

  const renderPromocode = (): JSX.Element | null => {
    if (promocodeApplied) {
      return (
        <div
          className='container row-center'
          style={{gap: 12, marginBottom: '14%'}}
        >
          <svg.CheckPromocodeSvg />
        </div>
      );
    }

    if (!promocodeApplied) {
      return (
        <div
          className='row-center-space-between container'
          style={{gap: 10, marginBottom: '14%'}}
        >
          <custom.InputField
            placeholder='Enter promocode'
            containerStyle={{width: '66%'}}
          />
          <div style={{width: '34%'}}>
            <components.Button
              text='Apply'
              colorScheme='secondary'
              containerStyle={{width: '100%'}}
              onClick={() => setPromocodeApplied(true)}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSummary = (): JSX.Element => {
    return (
      <section
        className='container'
        style={{marginBottom: 10}}
      >
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
          <div
            className='row-center-space-between'
            style={{
              paddingBottom: 10,
              borderBottom: '2px solid var(--border-color)',
              marginBottom: 10,
            }}
          >
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
              ${cart.total.toFixed(2)}
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
