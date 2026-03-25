import React, {useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

import {Routes} from '../enums';
import {supabase} from '../supabaseClient';

/**
 * Si el perfil tiene `is_blocked`, cierra sesión y envía a la pantalla de aviso.
 * En `/account-blocked` fuerza cierre de sesión si aún hubiera JWT.
 */
export const BlockedAccountGuard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const client = supabase;
    if (!client) {
      return;
    }

    let cancelled = false;

    const handleBlocked = async () => {
      const {
        data: {session},
      } = await client.auth.getSession();
      if (cancelled) {
        return;
      }

      if (location.pathname === Routes.AccountBlocked) {
        if (session) {
          await client.auth.signOut();
        }
        return;
      }

      if (!session) {
        return;
      }

      const {data: row} = await client
        .from('profiles')
        .select('is_blocked')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (row?.is_blocked) {
        await client.auth.signOut();
        navigate(Routes.AccountBlocked, {replace: true});
      }
    };

    void handleBlocked();

    const {
      data: {subscription},
    } = client.auth.onAuthStateChange((event, session) => {
      if (cancelled || event === 'SIGNED_OUT') {
        return;
      }
      void (async () => {
        if (location.pathname === Routes.AccountBlocked) {
          if (session) {
            await client.auth.signOut();
          }
          return;
        }
        if (!session) {
          return;
        }
        const {data: row} = await client
          .from('profiles')
          .select('is_blocked')
          .eq('id', session.user.id)
          .maybeSingle();
        if (cancelled) {
          return;
        }
        if (row?.is_blocked) {
          await client.auth.signOut();
          navigate(Routes.AccountBlocked, {replace: true});
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  return null;
};
