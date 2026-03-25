import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';
import { APP_PALETTE } from '../theme/appPalette';

export const SignUpAccountCreated: React.FC = () => {
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
        <div
          className='container'
          style={{
            width: '100%',
          }}
        >
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
            src='https://george-fx.github.io/beshop_api/assets/other/10.png'
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
              marginBottom: 14,
              textTransform: 'capitalize',
            }}
          >
            Account Created!
          </h2>
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Your account had beed created <br />
            successfully.
          </p>
          <components.Button
            text='shop now'
            to='/'
          />
        </div>
      </main>
    );
  };

  return renderContent();
};
