import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';

export const OrderSuccessful: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
    dispatch(actions.resetCart());
  }, [dispatch]);

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable container center'
        style={{zIndex: 1}}
      >
        <div style={{width: '100%'}}>
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/07.png'
            alt='empty-cart'
            style={{
              width: '80%',
              height: 'auto',
              alignSelf: 'center',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 30,
            }}
          />
          <h2
            style={{
              textTransform: 'capitalize',
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            Thank you for your order!
          </h2>
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Your order will be delivered on time. <br /> Thank you!
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

  return <>{renderContent()}</>;
};
