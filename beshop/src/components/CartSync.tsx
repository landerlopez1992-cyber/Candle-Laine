import React, {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {RootState} from '../store';
import {actions} from '../store/actions';
import {resetCart} from '../store/slices/cartSlice';
import {supabase} from '../supabaseClient';
import {loadUserCart, syncCartToServer} from '../utils/cartPersistence';

/**
 * Carga el carrito desde Supabase al iniciar sesión y lo guarda al cambiar.
 */
export const CartSync: React.FC = () => {
  const dispatch = useDispatch();
  const cartList = useSelector((s: RootState) => s.cartSlice.list);
  const skipFirstSync = useRef(true);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const client = supabase;

    const init = async () => {
      const {
        data: {session},
      } = await client.auth.getSession();
      if (session?.user) {
        const list = await loadUserCart(session.user.id);
        if (list.length > 0) {
          dispatch(actions.hydrateCart(list));
        }
      }
    };
    void init();

    const {
      data: {subscription},
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const list = await loadUserCart(session.user.id);
        dispatch(actions.hydrateCart(list));
      } else if (event === 'SIGNED_OUT') {
        dispatch(resetCart());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const client = supabase;
    if (skipFirstSync.current) {
      skipFirstSync.current = false;
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        const {
          data: {session},
        } = await client.auth.getSession();
        if (!session?.user) {
          return;
        }
        await syncCartToServer(session.user.id, cartList);
      })();
    }, 650);
    return () => clearTimeout(t);
  }, [cartList]);

  return null;
};
