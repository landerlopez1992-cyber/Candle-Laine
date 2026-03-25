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

const cardStyle: React.CSSProperties = {
  backgroundColor: APP_PALETTE.cartCardSurface,
  border: `1px solid ${APP_PALETTE.border}`,
  borderRadius: 12,
  padding: '24px 20px 28px',
  boxSizing: 'border-box',
  width: '100%',
  maxWidth: 440,
  marginLeft: 'auto',
  marginRight: 'auto',
};

const inputShell: React.CSSProperties = {
  backgroundColor: APP_PALETTE.imageWell,
  border: `1px solid ${APP_PALETTE.border}`,
};

export const SignIn: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const handleSignIn = useCallback(async () => {
    setError(null);
    if (!supabase) {
      setError(
        'Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env.local and restart the dev server.',
      );
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    /** En el navegador `window.setTimeout` devuelve `number`; con @types/node, `setTimeout` es `NodeJS.Timeout`. */
    let timeoutId: number | undefined;
    const signInTimeoutMs = 45_000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('SIGN_IN_TIMEOUT'));
      }, signInTimeoutMs);
    });
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        }),
        timeoutPromise,
      ]);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      const {error: signInError} = result;
      if (signInError) {
        setError(signInError.message);
        return;
      }
      navigate(Routes.TabNavigator);
    } catch (e) {
      let msg = 'Sign in failed. Please try again.';
      if (e instanceof Error) {
        if (e.message === 'SIGN_IN_TIMEOUT') {
          msg =
            'Sign in is taking too long. Check your network, close other tabs with this app, reload the page, or set REACT_APP_SUPABASE_FETCH_TIMEOUT_MS in .env.local.';
        } else if (e.name === 'AbortError' || /aborted/i.test(e.message)) {
          msg =
            'Request timed out or was cancelled. Check your network, REACT_APP_SUPABASE_URL in .env.local, and that the Supabase project is running.';
        } else if (/failed to fetch|networkerror|load failed/i.test(e.message)) {
          msg =
            'Could not reach Supabase. Check your connection, firewall/VPN, and REACT_APP_SUPABASE_URL.';
        } else {
          msg = e.message;
        }
      }
      setError(msg);
    } finally {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  }, [email, navigate, password]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Sign In'
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
          padding: '20px 20px 32px',
          backgroundColor: APP_PALETTE.appShell,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        <div className='container' style={{maxWidth: 480, margin: '0 auto'}}>
          <components.Container containerStyle={cardStyle}>
            <h1
              style={{
                textAlign: 'center',
                marginBottom: 8,
                textTransform: 'capitalize',
                color: 'var(--text-on-light)',
                fontFamily: 'League Spartan, sans-serif',
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              Welcome back
            </h1>
            <span
              className='t16'
              style={{
                textAlign: 'center',
                display: 'block',
                marginBottom: 24,
                color: 'var(--text-on-light)',
                opacity: 0.9,
              }}
            >
              Sign in with your email
            </span>
            <custom.InputField
              containerStyle={{...inputShell, marginBottom: 12}}
              placeholder='your@email.com'
              icon={<svg.CheckSvg />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete='email'
              inputMode='email'
              disabled={loading}
            />
            <custom.InputField
              type='password'
              containerStyle={{...inputShell, marginBottom: 20}}
              placeholder='••••••••'
              icon={<svg.EyeOffSvg />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
              disabled={loading}
            />
            <div
              className='row-center-space-between'
              style={{marginBottom: 20}}
            >
              <div className='row-center clickable'>
                <button
                  type='button'
                  style={{
                    gap: 10,
                    display: 'flex',
                    alignItems: 'center',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      backgroundColor: APP_PALETTE.imageWell,
                      border: `1px solid ${APP_PALETTE.border}`,
                    }}
                    className='center'
                  >
                    {rememberMe && <svg.CheckSvg />}
                  </div>
                  <span className='t18' style={{color: 'var(--text-on-light)'}}>
                    Remember me
                  </span>
                </button>
              </div>
              <Link
                className='t18'
                to={Routes.ForgotPassword}
                style={{
                  color: APP_PALETTE.accent,
                }}
              >
                Lost your password?
              </Link>
            </div>
            {error && (
              <p
                className='t14'
                style={{
                  color: '#a33',
                  marginBottom: 16,
                  textAlign: 'center',
                  lineHeight: 1.45,
                }}
              >
                {error}
              </p>
            )}
            <components.Button
              text={loading ? 'Please wait…' : 'Sign in'}
              onClick={() => void handleSignIn()}
              containerStyle={{
                marginBottom: 20,
                opacity: loading ? 0.85 : 1,
                pointerEvents: loading ? 'none' : 'auto',
              }}
            />
            <p
              className='t16'
              style={{textAlign: 'center', color: 'var(--text-on-light)'}}
            >
              No account?{' '}
              <Link
                to={Routes.SignUp}
                style={{color: APP_PALETTE.accent, fontWeight: 600}}
              >
                Register now
              </Link>
            </p>
          </components.Container>
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
