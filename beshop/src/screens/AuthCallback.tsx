import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {Routes} from '../enums';
import {supabase} from '../supabaseClient';
import {components} from '../components';

/**
 * Landing route after the user opens the Supabase confirmation link in email.
 * Dashboard: Authentication → URL Configuration → add Redirect URL
 * e.g. http://localhost:3000/auth/callback (and production URL).
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate(Routes.SignIn, {replace: true});
      return;
    }

    let cancelled = false;
    let navigated = false;

    const go = (path: string) => {
      if (cancelled || navigated) {
        return;
      }
      navigated = true;
      navigate(path, {replace: true});
    };

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        go(Routes.SignUpAccountCreated);
      }
    });

    (async () => {
      for (let i = 0; i < 25 && !cancelled && !navigated; i++) {
        const {
          data: {session},
        } = await supabase.auth.getSession();
        if (session) {
          go(Routes.SignUpAccountCreated);
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled && !navigated) {
        go(Routes.SignIn);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main
      className='scrollable'
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: 24,
      }}
    >
      <p
        className='t16'
        style={{textAlign: 'center', marginBottom: 24}}
      >
        Confirming your email…
      </p>
      <components.Loader />
    </main>
  );
};
