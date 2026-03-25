import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {svg} from '../assets/svg';
import {components} from '../components';
import {actions} from '../store/actions';

import background from '../assets/bg/07.png';
import { APP_PALETTE } from '../theme/appPalette';

export const NewPassword: React.FC = () => {
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
        title='Reset password'
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
            className='t18'
            style={{marginBottom: 30}}
          >
            Enter new password and confirm.
          </p>
          <custom.InputField
            placeholder='New password'
            containerStyle={{
              marginBottom: 16,
            }}
            icon={<svg.EyeOffSvg />}
          />
          <custom.InputField
            placeholder='Confirm your password'
            containerStyle={{
              marginBottom: 16,
            }}
            icon={<svg.EyeOffSvg />}
          />
          <components.Button
            text='change password'
            to='/forgot-password-sent-email'
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
