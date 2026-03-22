import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';

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

  hooks.useThemeColor('#FCEDEA');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Shipping details'
        headerStyle={{
          backgroundColor: '#FCEDEA',
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
          backgroundColor: 'var(--white-color)',
        }}
      >
        {addressess.map((address, index, array) => {
          const isLast = index === array.length - 1;

          return (
            <button
              key={address.id}
              style={{
                padding: '10px 20px',
                width: '100%',
                marginBottom: isLast ? 0 : 8,
                border: '1px solid var(--border-color)',
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
                    color: 'var(--main-color)',
                    lineHeight: 1.2,
                    fontSize: 16,
                  }}
                >
                  {address.name}
                </span>
                <span className='t14'>{address.address}</span>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: `2px solid ${
                    selectedAddress === address.id ? '#D05278' : '#999999'
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
                      backgroundColor: '#D05278',
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
