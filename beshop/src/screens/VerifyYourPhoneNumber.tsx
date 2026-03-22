import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';

import background from '../assets/bg/07.png';

export const VerifyYourPhoneNumber: React.FC = () => {
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
            We have sent you an SMS with a code to number +17 0123456789.
          </p>
          <custom.InputField
            placeholder='+17123456789'
            containerStyle={{
              marginBottom: 16,
            }}
          />
          <components.Button
            text='confirm'
            to={Routes.ConfirmationCode}
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
