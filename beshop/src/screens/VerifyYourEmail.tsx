import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {custom} from '../custom';
import {components} from '../components';
import {actions} from '../store/actions';

export const VerifyYourEmail: React.FC = () => {
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Verify Your Email'
        showGoBack={true}
        headerStyle={{backgroundColor: '#fff'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
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
            We have sent you an email with a verification code.
          </p>
          <custom.InputField
            placeholder='kristinwatson@mail.com'
            containerStyle={{marginBottom: 16}}
          />
          <components.Button
            text='confirm'
            to={Routes.Verification}
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
