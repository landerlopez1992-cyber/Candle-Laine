import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';

const cardSurface: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  padding: '24px 20px',
};

const inputWrap: React.CSSProperties = {
  marginBottom: 16,
  borderRadius: 8,
  backgroundColor: APP_PALETTE.inputSurface,
  border: `1px solid ${APP_PALETTE.border}`,
};

export const ForgotPassword: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Forgot Password'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: APP_PALETTE.appShell,
          paddingTop: 16,
          paddingBottom: 28,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginLeft: 20,
            marginRight: 20,
          }}
        >
          <div style={cardSurface}>
            <p
              className='t16'
              style={{
                marginBottom: 24,
                marginTop: 0,
                color: 'var(--text-on-light)',
                lineHeight: 1.55,
              }}
            >
              Please enter your email address. You will receive a link to create a
              new password via email.
            </p>
            <custom.InputField
              placeholder='Email address'
              containerStyle={inputWrap}
              autoComplete='email'
              inputMode='email'
            />
            <components.Button
              text='send'
              to='/new-password'
            />
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
