import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {components} from '../components';
import {actions} from '../store/actions';
import { APP_PALETTE } from '../theme/appPalette';

export const MyPromocodesEmpty: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Add A Promocode'
        headerStyle={{backgroundColor: 'transparent'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <div
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
            paddingTop: 32,
            paddingBottom: 20,
          }}
        >
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/03.png'
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
            Your don’t have <br />
            promocodes yet!
          </h2>
          <p
            className='t16'
            style={{textAlign: 'center', marginBottom: 30}}
          >
            Qui ex aute ipsum duis. Incididunt <br /> adipisicing voluptate
            laborum
          </p>
          <custom.InputField
            placeholder='Discount2024'
            containerStyle={{marginBottom: 20}}
          />
          <components.Button
            to='back'
            text='Add a  promocode'
          />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {renderHeader()}
      {renderContent()}
    </div>
  );
};
