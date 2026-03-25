import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {custom} from '../custom';
import {actions} from '../store/actions';
import {components} from '../components';
import { APP_PALETTE } from '../theme/appPalette';

// import background from '../assets/bg/03.png';

export const ShippingAPaymentInfo: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Shipping & payment info'
        showGoBack={true}
        headerStyle={{backgroundColor: 'transparent'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 30,
          }}
        >
          <custom.InputField
            containerStyle={{marginBottom: 16}}
            placeholder='Enter your name'
          />
          <custom.InputField
            containerStyle={{marginBottom: 16}}
            placeholder='Enter your email'
          />
          <custom.InputField
            containerStyle={{marginBottom: 16}}
            placeholder='Enter your phone number'
          />
          <custom.InputField
            containerStyle={{marginBottom: 16}}
            placeholder='Enter your address'
          />
          <custom.InputField
            containerStyle={{marginBottom: 16}}
            placeholder='Enter your credit card number'
          />

          <div
            className='row-center'
            style={{gap: 15}}
          >
            <custom.InputField
              containerStyle={{marginBottom: 16}}
              placeholder='MM/YY'
            />
            <custom.InputField
              containerStyle={{marginBottom: 16}}
              placeholder='CVV'
            />
          </div>
          <components.Button
            text='proceed to checkout'
            to={Routes.Checkout}
            containerStyle={{marginBottom: 24}}
          />
        </div>
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
