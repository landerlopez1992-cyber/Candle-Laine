import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import { APP_PALETTE } from '../theme/appPalette';

const addressess = [
  {
    id: 1,
    name: 'Home',
    address: '8000 S Kirkland Ave, Chicago...',
  },
  {
    id: 2,
    name: 'Work',
    address: '8000 S Kirkland Ave, Chicago...',
  },
  {
    id: 3,
    name: 'Work',
    address: '8000 S Kirkland Ave, Chicago...',
  },
];

export const CheckoutShippingDetails: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [selectedAddress, setSelectedAddress] = useState<number | null>(
    addressess[0].id,
  );

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Shipping details'
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
        showGoBack={true}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          padding: 20,
          paddingBottom: 28,
          backgroundColor: APP_PALETTE.appShell,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        {addressess.map((address, index, array) => {
          const isLast = index === array.length - 1;

          return (
            <button
              key={address.id}
              type='button'
              style={{
                padding: '10px 20px',
                width: '100%',
                marginBottom: isLast ? 0 : 8,
                border: '1px solid var(--border-color)',
                backgroundColor: APP_PALETTE.cartCardSurface,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              className='row-center-space-between'
              onClick={() => setSelectedAddress(address.id)}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Tenor Sans',
                    color: 'var(--text-on-light)',
                    lineHeight: 1.2,
                    fontSize: 16,
                  }}
                >
                  {address.name}
                </span>
                <span className='t14' style={{color: 'var(--text-on-light)'}}>
                  {address.address}
                </span>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: `2px solid ${
                    selectedAddress === address.id
                      ? APP_PALETTE.accent
                      : '#999999'
                  }`,
                }}
                className='center'
              >
                {selectedAddress === address.id && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: APP_PALETTE.accent,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
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
