import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';

const creditCards = [
  {
    id: '1',
    name: 'Visa',
    number: '7741 ******** 6644',
  },
  {
    id: '2',
    name: 'Mastercard',
    number: '7674 ******** 1884',
  },
];

export const CheckoutPaymentMethod: React.FC = () => {
  hooks.useThemeColor('#FCEDEA');
  const dispatch = hooks.useDispatch();

  const [selectedCash, setSelectedCash] = useState<boolean>(false);
  const [selectedPayPal, setSelectedPayPal] = useState<boolean>(false);
  const [selectedApplePay, setSelectedApplePay] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(
    creditCards[1].id,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Payment Method'
        headerStyle={{backgroundColor: '#FCEDEA'}}
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
        {/* Credit Cards */}
        <components.Container containerStyle={{marginBottom: 8}}>
          <div
            style={{
              marginBottom: 18,
              paddingBottom: 10,
              borderBottom: '2px solid var(--main-color)',
            }}
          >
            <h5>Credit Cards</h5>
          </div>
          {creditCards.map((card, index, array) => {
            const isLast = index === array.length - 1;

            return (
              <div
                key={card.id}
                style={{marginBottom: isLast ? 0 : 15}}
                onClick={() => {
                  setSelectedCash(false);
                  setSelectedPayPal(false);
                  setSelectedApplePay(false);
                  setSelectedCard(card.id);
                }}
                className='row-center-space-between clickable'
              >
                <span className='t14'>{card.number}</span>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    border: `2px solid ${
                      selectedCard === card.id
                        ? 'var(--accent-color)'
                        : '#999999'
                    }`,
                  }}
                  className='center'
                >
                  {selectedCard === card.id && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'var(--accent-color)',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </components.Container>
        {/* Apple Pay */}
        <div
          style={{
            padding: 20,
            marginBottom: 8,
            border: '1px solid #E5E5E5',
          }}
          className='row-center-space-between clickable'
          onClick={() => {
            setSelectedCard(null);
            setSelectedCash(false);
            setSelectedPayPal(false);
            setSelectedApplePay(true);
          }}
        >
          <h5>Apple Pay</h5>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              border: '2px solid #999999',
            }}
            className='center'
          >
            {selectedApplePay && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'var(--accent-color)',
                }}
              />
            )}
          </div>
        </div>
        {/* Pay Pal */}
        <div
          style={{
            padding: 20,
            marginBottom: 8,
            border: '1px solid #E5E5E5',
          }}
          className='row-center-space-between clickable'
          onClick={() => {
            setSelectedCard(null);
            setSelectedCash(false);
            setSelectedPayPal(true);
            setSelectedApplePay(false);
          }}
        >
          <h5>Pay Pal</h5>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              border: '2px solid #999999',
            }}
            className='center'
          >
            {selectedPayPal && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'var(--accent-color)',
                }}
              />
            )}
          </div>
        </div>
        {/* Cash */}
        <div
          style={{
            padding: 20,
            border: '1px solid #E5E5E5',
          }}
          className='row-center-space-between clickable'
          onClick={() => {
            setSelectedCard(null);
            setSelectedCash(true);
            setSelectedPayPal(false);
            setSelectedApplePay(false);
          }}
        >
          <h5>Cash</h5>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              border: '2px solid #999999',
            }}
            className='center'
          >
            {selectedCash && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'var(--accent-color)',
                }}
              />
            )}
          </div>
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
