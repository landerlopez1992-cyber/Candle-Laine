import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';

import background from '../assets/bg/07.png';

export const ConfirmationCode: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Verify Number'
        headerStyle={{backgroundColor: 'var(--white-color)'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            paddingBottom: 30,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 30,
          }}
        >
          <p
            className='t16'
            style={{marginBottom: 30}}
          >
            Enter your OTP code here.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 30,
            }}
          >
            {['', '', '', '', ''].map((input, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  width: '17%',
                  aspectRatio: 1 / 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid var(--main-color)',
                  backgroundColor: 'var(--white-color)',
                }}
              >
                <input
                  maxLength={1}
                  style={{
                    textAlign: 'center',
                    width: '100%',
                    height: '100%',
                    fontFamily: 'League Spartan',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 20,
                  }}
                  type='number'
                  min={0}
                  max={9}
                />
              </div>
            ))}
          </div>
          <span
            className='row-center t16'
            style={{marginBottom: 30}}
          >
            Didn’t receive the OTP?{' '}
            <button
              style={{
                marginLeft: 4,
                color: 'var(--accent-color',
              }}
            >
              Resend.
            </button>{' '}
          </span>
          <components.Button
            text='confirm'
            to={Routes.SignUpAccountCreated}
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
