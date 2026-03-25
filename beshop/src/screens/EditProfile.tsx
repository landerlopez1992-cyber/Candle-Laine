import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {components} from '../components';
import {actions} from '../store/actions';

import {APP_PALETTE} from '../theme/appPalette';

export const EditProfile: React.FC = () => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Edit Profile'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <section
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
          padding: 20,
          minHeight: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--input-background)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              alignSelf: 'center',
              border: '4px solid var(--accent-color)',
              borderRadius: '50%',
              margin: '0 auto',
              marginBottom: 24,
            }}
          >
            <img
              alt='profile'
              src='https://george-fx.github.io/beshop_api/assets/users/01.jpg'
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </div>
          <custom.InputField
            placeholder='Dominic Paradis'
            containerStyle={{marginBottom: 10}}
          />
          <custom.InputField
            placeholder='kristinwatson@mail.com'
            containerStyle={{marginBottom: 10}}
          />
          <custom.InputField
            placeholder='+17123456789'
            containerStyle={{marginBottom: 10}}
          />
          <custom.InputField
            placeholder='USA / New York'
            containerStyle={{marginBottom: 18}}
          />
          <components.Button
            text='save changes'
            onClick={() => {
              navigate(-1);
            }}
          />
        </div>
      </section>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
