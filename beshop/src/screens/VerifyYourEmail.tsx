import {Link, useLocation, useNavigate} from 'react-router-dom';
import React, {useEffect, useMemo, useState} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {components} from '../components';
import {actions} from '../store/actions';
import {supabase} from '../supabaseClient';

import background from '../assets/bg/07.png';
import { APP_PALETTE } from '../theme/appPalette';

const SIGNUP_EMAIL_STORAGE_KEY = 'candle_signup_email';

export const VerifyYourEmail: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = (location.state as {email?: string} | null)?.email;
  const storedEmail = useMemo(() => {
    try {
      return sessionStorage.getItem(SIGNUP_EMAIL_STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  const email = emailFromState ?? storedEmail ?? '';

  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!email) {
      navigate(Routes.SignUp, {replace: true});
    }
  }, [email, navigate]);

  const handleResend = async () => {
    setResendMessage(null);
    if (!supabase || !email) {
      setResendMessage('Supabase is not configured.');
      return;
    }
    setResendBusy(true);
    const {error} = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResendBusy(false);
    if (error) {
      setResendMessage(error.message);
    } else {
      setResendMessage('Another confirmation email has been sent.');
    }
  };

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
    if (!email) {
      return <main className='scrollable' />;
    }

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
            paddingTop: '12%',
          }}
        >
          <p
            className='t18'
            style={{marginBottom: 16, textAlign: 'center'}}
          >
            We sent a confirmation link to:
          </p>
          <p
            className='t18'
            style={{
              marginBottom: 24,
              textAlign: 'center',
              fontWeight: 600,
              wordBreak: 'break-word',
            }}
          >
            {email}
          </p>
          <p
            className='t16'
            style={{marginBottom: 30, textAlign: 'center', lineHeight: 1.5}}
          >
            Open the email and tap the link to activate your account. Check spam
            if you do not see it.
          </p>
          {resendMessage && (
            <p
              className='t16'
              style={{
                textAlign: 'center',
                marginBottom: 16,
                color: 'var(--accent-color)',
              }}
            >
              {resendMessage}
            </p>
          )}
          <components.Button
            text={resendBusy ? 'Please wait…' : 'Resend email'}
            onClick={handleResend}
            containerStyle={{marginBottom: 24}}
          />
          <div
            className='t16'
            style={{textAlign: 'center'}}
          >
            Already confirmed?{' '}
            <Link
              to={Routes.SignIn}
              style={{color: 'var(--accent-color)'}}
            >
              Sign in
            </Link>
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
