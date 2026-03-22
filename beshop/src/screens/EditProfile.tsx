import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {components} from '../components';
import {actions} from '../store/actions';

import background from '../assets/bg/07.png';

export const EditProfile: React.FC = () => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Edit Profile'
        showGoBack={true}
        headerStyle={{backgroundColor: 'transparent'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <section className='scrollable'>
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: 20,
            margin: 20,
            paddingTop: 40,
            height: '100%',
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              alignSelf: 'center',
              border: '6px solid var(--accent-color)',
              borderRadius: '50%',
              margin: '0 auto',
              marginBottom: 30,
            }}
          >
            <img
              alt='profile'
              src='https://george-fx.github.io/beshop_api/assets/users/01.jpg'
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
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
            containerStyle={{marginBottom: 10}}
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
