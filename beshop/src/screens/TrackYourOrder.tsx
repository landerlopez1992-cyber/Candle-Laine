import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';

export const TrackYourOrder: React.FC = () => {
  hooks.useThemeColor('#FCEDEA');
  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Track Your Order'
        headerStyle={{backgroundColor: '#FCEDEA'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          paddingTop: 17,
          paddingBottom: 20,
        }}
      >
        <img
          src='https://george-fx.github.io/beshop_api/assets/other/05.png'
          alt='empty-cart'
          style={{
            width: '60%',
            height: 'auto',
            alignSelf: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: 30,
          }}
        />
        <h3
          style={{
            textAlign: 'center',
            marginBottom: 4,
            textTransform: 'capitalize',
          }}
        >
          Your order:
        </h3>
        <span
          className='t16'
          style={{textAlign: 'center', display: 'block', marginBottom: 20}}
        >
          #205479
        </span>
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
          // confirmed={true}
          currentStatus={true}
          status='Order shipping'
          description='Estimated for Jul 12, 2022'
        />
        <components.OrderStatus
          status='Courier delivering'
          description='Estimated for Jul 15, 2022'
        />
        <components.OrderStatus
          status='Receiving'
          description='Estimated for Jul 15, 2022'
        />
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
