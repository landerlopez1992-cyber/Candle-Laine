import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';
import { APP_PALETTE } from '../theme/appPalette';

export const ForgotPasswordSentEmail: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div className='container'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <svg.LogoSvg />
          </div>
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/09.png'
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
              textAlign: 'center',
              marginBottom: 12,
              textTransform: 'capitalize',
            }}
          >
            Your password has <br />
            been reset!
          </h2>
          <p
            className='t18'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Log in with your new credentials. <br /> Welcome back!
          </p>
          <components.Button
            text='done'
            to='/'
          />
        </div>
      </main>
    );
  };

  return renderContent();
};
