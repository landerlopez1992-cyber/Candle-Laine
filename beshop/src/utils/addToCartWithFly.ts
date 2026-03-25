import type {ProductType} from '../types';
import {addToCart} from '../store/slices/cartSlice';
import {runFlyToCartAnimation} from './flyToCart';

/**
 * Dispatch `addToCart` y, si hay elemento de imagen, reproduce la animación hacia el icono del carrito.
 * Usar en todos los botones "añadir al carrito" para un comportamiento uniforme.
 */
export function dispatchAddToCartWithFly(
  dispatch: (action: ReturnType<typeof addToCart>) => void,
  product: ProductType,
  sourceImageEl: HTMLElement | null | undefined,
  flyImageUrl?: string,
): void {
  const url = flyImageUrl ?? product.image;
  if (sourceImageEl) {
    runFlyToCartAnimation(sourceImageEl, url);
  }
  dispatch(addToCart(product));
}
