import {Link} from 'react-router-dom';
import React, {useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {custom} from '../custom';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';

import background from '../assets/bg/07.png';

export const SignIn: React.FC = () => {
  const dispatch = hooks.useDispatch();

  const [rememberMe, setRememberMe] = useState<boolean>(false);

  hooks.useThemeColor('#fff');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor('#fff'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Sign In'
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
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: '16%',
            height: '100%',
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              marginBottom: 14,
              textTransform: 'capitalize',
            }}
          >
            Welcome Back!
          </h1>
          <span
            className='t16'
            style={{textAlign: 'center', display: 'block', marginBottom: 30}}
          >
            Use social networks or your email
          </span>
          <div
            className='row center'
            style={{gap: 10, marginBottom: 30}}
          >
            <button>
              <svg.FaceBookSvg />
            </button>
            <button>
              <svg.TwitterSvg />
            </button>
            <button>
              <svg.GoogleSvg />
            </button>
          </div>
          <custom.InputField
            containerStyle={{marginBottom: 10}}
            placeholder='kristinwatson@mail.com'
            icon={<svg.CheckSvg />}
          />
          <custom.InputField
            containerStyle={{marginBottom: 20}}
            placeholder='••••••••'
            icon={<svg.EyeOffSvg />}
          />
          <div
            className='row-center-space-between'
            style={{marginBottom: 30}}
          >
            <div className='row-center clickable'>
              <div
                style={{gap: 10}}
                className='row-center clickable'
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: 'var(--white-color)',
                  }}
                  className='center'
                >
                  {rememberMe && <svg.CheckSvg />}
                </div>
                <span className='t18'>Remember me</span>
              </div>
            </div>
            <Link
              className='t18'
              to='/forgot-password'
              style={{
                color: 'var(--accent-color)',
              }}
            >
              Lost your password?
            </Link>
          </div>
          <components.Button
            text='Sign in'
            to={Routes.TabNavigator}
            containerStyle={{marginBottom: 21}}
          />
          <div className='t16'>
            No account?{' '}
            <Link
              to={Routes.SignUp}
              style={{color: 'var(--accent-color)'}}
            >
              Register now
            </Link>{' '}
          </div>
        </div>
      </main>
    );
  };

  const renderIndent = (): JSX.Element => {
    return (
      <div
        style={{
          height: 34,
          backgroundColor: 'var(--white-color)',
        }}
      />
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderIndent()}
    </>
  );
};
