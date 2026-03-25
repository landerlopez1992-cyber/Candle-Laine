import {configureStore, EnhancedStore} from '@reduxjs/toolkit';

import {BGState} from './slices/bgSlice';
import {TabState} from './slices/tabSlice';
import {CartType} from './slices/cartSlice';
import {SortState} from './slices/sortSlice';
import {FilterState} from './slices/filterSlice';
import {WishlistState} from './slices/wishlistSlice';
import {VerificationState} from './slices/verificationSlice';
import type {PaymentState} from './slices/paymentSlice';
import type {PromocodelistState} from './slices/promocodeSlice';

import {bgSlice} from './slices/bgSlice';
import {tabSlice} from './slices/tabSlice';
import {userSlice} from './slices/userSlice';
import {cartSlice} from './slices/cartSlice';
import {sortSlice} from './slices/sortSlice';
import {filterSlice} from './slices/filterSlice';
import {paymentSlice} from './slices/paymentSlice';
import {wishlistSlice} from './slices/wishlistSlice';
import {promocodeSlice} from './slices/promocodeSlice';
import {firstLaunchSlice} from './slices/firstLaunchSlice';
import {verificationSlice} from './slices/verificationSlice';
import {readPersistedCartWishlist, persistCartWishlist} from '../utils/cartWishlistStorage';

const persistedCartWishlist = readPersistedCartWishlist();

export const store: EnhancedStore = configureStore({
  reducer: {
    bgSlice: bgSlice.reducer,
    tabSlice: tabSlice.reducer,
    userSlice: userSlice.reducer,
    cartSlice: cartSlice.reducer,
    sortSlice: sortSlice.reducer,
    filterSlice: filterSlice.reducer,
    paymentSlice: paymentSlice.reducer,
    wishlistSlice: wishlistSlice.reducer,
    promocodeSlice: promocodeSlice.reducer,
    firstLaunchSlice: firstLaunchSlice.reducer,
    verificationSlice: verificationSlice.reducer,
  },
  ...(persistedCartWishlist
    ? {
        preloadedState: {
          cartSlice: persistedCartWishlist.cartSlice,
          wishlistSlice: persistedCartWishlist.wishlistSlice,
        },
      }
    : {}),
});

if (typeof window !== 'undefined') {
  let persistT: ReturnType<typeof setTimeout> | undefined;
  store.subscribe(() => {
    if (persistT) {
      clearTimeout(persistT);
    }
    persistT = setTimeout(() => {
      const s = store.getState();
      persistCartWishlist(s.cartSlice, s.wishlistSlice);
    }, 280);
  });
}

export interface RootState {
  bgSlice: BGState;
  tabSlice: TabState;
  cartSlice: CartType;
  sortSlice: SortState;
  filterSlice: FilterState;
  paymentSlice: PaymentState;
  wishlistSlice: WishlistState;
  promocodeSlice: PromocodelistState;
  firstLaunchSlice: {firstLaunch: boolean};
  verificationSlice: VerificationState;
}
