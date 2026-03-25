import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {Screens} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import { APP_PALETTE } from '../theme/appPalette';

export const OrderFailed: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const navigate = hooks.useNavigate();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable container center'
        style={{zIndex: 1}}
      >
        <div style={{width: '100%'}}>
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/08.png'
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
            Sorry! Your order has <br /> failed!
          </h2>
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Something went wrong. Please try again <br /> to contimue your
            order.
          </p>
          <components.Button
            text='try again'
            onClick={() => {
              dispatch(actions.setScreen(Screens.Cart));
              navigate(Routes.TabNavigator);
            }}
            containerStyle={{width: '100%', marginBottom: 10}}
          />
          <components.Button
            text='go to my profile'
            colorScheme='secondary'
            onClick={() => {
              dispatch(actions.setScreen(Screens.Profile));
              navigate(Routes.TabNavigator);
            }}
            containerStyle={{width: '100%'}}
          />
        </div>
      </main>
    );
  };

  return <>{renderContent()}</>;
};
