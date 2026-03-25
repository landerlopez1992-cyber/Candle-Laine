import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {actions} from '../store/actions';
import {components} from '../components';

import background from '../assets/bg/07.png';
import { APP_PALETTE } from '../theme/appPalette';

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
            Please enter your email address. You will receive a link to create a
            new password via email.
          </p>
          <custom.InputField
            placeholder='kristinwatson@mail.com'
            containerStyle={{
              marginBottom: 16,
            }}
          />
          <components.Button
            text='send'
            to='/new-password'
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
