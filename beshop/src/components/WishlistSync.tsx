import React, {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {RootState, store} from '../store';
import {actions} from '../store/actions';
import {supabase} from '../supabaseClient';
import {
  loadUserWishlist,
  syncWishlistToServer,
} from '../utils/wishlistPersistence';

async function reconcileWishlistWithServer(userId: string): Promise<void> {
  const serverList = await loadUserWishlist(userId);
  const localList = store.getState().wishlistSlice.list;
  if (serverList.length > 0) {
    store.dispatch(actions.setWishlist(serverList));
  } else if (localList.length > 0) {
    store.dispatch(actions.setWishlist(localList));
    await syncWishlistToServer(userId, localList);
  } else {
    store.dispatch(actions.setWishlist([]));
  }
}

/**
 * Carga la wishlist desde Supabase al iniciar sesión y la guarda al cambiar
 * (mismo patrón que CartSync). localStorage se sube al servidor si aún no hay datos.
 */
export const WishlistSync: React.FC = () => {
  const dispatch = useDispatch();
  const wishlist = useSelector((s: RootState) => s.wishlistSlice.list);
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
        await reconcileWishlistWithServer(session.user.id);
      }
    };
    void init();

    const {
      data: {subscription},
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await reconcileWishlistWithServer(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        dispatch(actions.resetWishlist());
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
        await syncWishlistToServer(session.user.id, wishlist);
      })();
    }, 650);
    return () => clearTimeout(t);
  }, [wishlist]);

  return null;
};
