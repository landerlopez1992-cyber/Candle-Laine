import React, {useEffect} from 'react';

import {hooks} from '../../hooks';
import {actions} from '../../store/actions';
import {components} from '../../components';
import { APP_PALETTE } from '../../theme/appPalette';

export const WishlistEmpty: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showBasket={true}
        headerStyle={{
          backgroundColor: 'transparent',
        }}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className='container'>
            <img
              src='https://george-fx.github.io/beshop_api/assets/other/01.png'
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
              Your Wishlist is empty!
            </h2>
            <p
              className='t18'
              style={{textAlign: 'center', marginBottom: 30}}
            >
              Looks like you haven't chosen the <br /> items you like.
            </p>
            <components.Button
              text='shop now'
              to='/shop'
            />
          </div>
        </div>
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
