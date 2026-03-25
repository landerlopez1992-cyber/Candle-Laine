import {Link, useNavigate} from 'react-router-dom';
import React, {useCallback, useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {custom} from '../custom';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';
import {supabase} from '../supabaseClient';
import {APP_PALETTE} from '../theme/appPalette';

const SIGNUP_EMAIL_STORAGE_KEY = 'candle_signup_email';

const cardSurface: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
  borderRadius: 12,
  border: `1px solid ${APP_PALETTE.border}`,
  padding: '24px 20px',
};

const inputWrap: React.CSSProperties = {
  marginBottom: 10,
  borderRadius: 8,
  backgroundColor: APP_PALETTE.inputSurface,
  border: `1px solid ${APP_PALETTE.border}`,
};

export const SignUp: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const handleSignUp = useCallback(async () => {
    setError(null);

    if (!supabase) {
      setError('Supabase is not configured. Check your environment variables.');
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}${Routes.AuthCallback}`;
    const {error: signUpError} = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {full_name: trimmedName},
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    try {
      sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, trimmedEmail);
    } catch {
      /* ignore quota / private mode */
    }

    navigate(Routes.VerifyYourEmail, {state: {email: trimmedEmail}});
  }, [confirmPassword, email, fullName, navigate, password]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Sign Up'
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
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
                textAlign: 'center',
                marginTop: 0,
                marginBottom: 24,
                color: APP_PALETTE.textMuted,
                lineHeight: 1.5,
              }}
            >
              Create an account with your email
            </p>
            <custom.InputField
              containerStyle={inputWrap}
              placeholder='Enter your name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete='name'
            />
            <custom.InputField
              containerStyle={inputWrap}
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete='email'
              inputMode='email'
            />
            <custom.InputField
              type='password'
              containerStyle={inputWrap}
              placeholder='Enter your password'
              icon={<svg.EyeOffSvg />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='new-password'
            />
            <custom.InputField
              type='password'
              containerStyle={{...inputWrap, marginBottom: 20}}
              placeholder='Confirm your password'
              icon={<svg.EyeOffSvg />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete='new-password'
            />
            {error && (
              <p
                className='t14'
                style={{
                  color: APP_PALETTE.accent,
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            )}
            <components.Button
              text={loading ? 'Please wait…' : 'Sign Up'}
              onClick={handleSignUp}
              containerStyle={{marginBottom: 20}}
            />
            <div
              className='t16'
              style={{
                textAlign: 'center',
                color: APP_PALETTE.textMuted,
              }}
            >
              Already have an account?{' '}
              <Link
                to={Routes.SignIn}
                style={{color: APP_PALETTE.accent}}
              >
                Sign in
              </Link>
            </div>
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
