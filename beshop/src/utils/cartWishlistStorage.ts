import type {CartType} from '../store/slices/cartSlice';
import type {WishlistState} from '../store/slices/wishlistSlice';
import type {ProductType} from '../types';

const CART_KEY = 'candlelaine_cart_v1';
const WISHLIST_KEY = 'candlelaine_wishlist_v1';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isProductLike(v: unknown): v is ProductType {
  if (!isRecord(v)) {
    return false;
  }
  const id = v.id;
  if (typeof id !== 'string' && typeof id !== 'number') {
    return false;
  }
  return typeof v.name === 'string' && typeof v.price === 'number';
}

function parseCart(raw: unknown): CartType | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (!Array.isArray(raw.list)) {
    return null;
  }
  const list = raw.list.filter(isProductLike);
  const num = (k: string, d: number) => {
    const n = Number(raw[k]);
    return Number.isFinite(n) ? n : d;
  };
  return {
    list,
    total: num('total', 0),
    delivery: num('delivery', 0),
    discount: num('discount', 0),
    subtotal: num('subtotal', 0),
    promoCode: typeof raw.promoCode === 'string' ? raw.promoCode : '',
    discountAmount: num('discountAmount', 0),
  };
}

function parseWishlist(raw: unknown): WishlistState | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (!Array.isArray(raw.list)) {
    return null;
  }
  const list = raw.list.filter(isProductLike);
  return {list};
}

/**
 * Lee carrito y wishlist desde localStorage (supervivencia a recarga / cierre PWA).
 */
export function readPersistedCartWishlist(): {
  cartSlice: CartType;
  wishlistSlice: WishlistState;
} | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    const cartRaw = localStorage.getItem(CART_KEY);
    const wishRaw = localStorage.getItem(WISHLIST_KEY);
    if (!cartRaw && !wishRaw) {
      return undefined;
    }
    const cart = cartRaw ? parseCart(JSON.parse(cartRaw)) : null;
    const wishlist = wishRaw ? parseWishlist(JSON.parse(wishRaw)) : null;
    if (!cart && !wishlist) {
      return undefined;
    }
    return {
      cartSlice:
        cart ??
        ({
          total: 0,
          list: [],
          delivery: 0,
          discount: 0,
          subtotal: 0,
          promoCode: '',
          discountAmount: 0,
        } as CartType),
      wishlistSlice: wishlist ?? {list: []},
    };
  } catch {
    return undefined;
  }
}

export function persistCartWishlist(cart: CartType, wishlist: WishlistState): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  } catch (e) {
    console.warn('cartWishlistStorage: no se pudo guardar', e);
  }
}
