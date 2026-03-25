import React from 'react';

import {ProductType} from '../types';
import {APP_PALETTE} from '../theme/appPalette';

type Props = {
  product: ProductType;
  containerStyle?: React.CSSProperties;
};

/**
 * Cinta diagonal «Discount» (solo si el admin marcó descuento en el producto).
 */
export const Sale: React.FC<Props> = ({
  containerStyle,
  product,
}): JSX.Element | null => {
  if (!product.flag_discount) {
    return null;
  }
  const oldP = Number(product.oldPrice);
  const newP = Number(product.price);
  if (
    !Number.isFinite(oldP) ||
    !Number.isFinite(newP) ||
    oldP <= newP
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 76,
        height: 76,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
        ...containerStyle,
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: -32,
          width: 118,
          transform: 'rotate(45deg)',
          transformOrigin: 'center',
          background: `linear-gradient(115deg, ${APP_PALETTE.accent} 0%, #c9a06c 55%, #a67c3d 100%)`,
          color: '#1C2D18',
          fontFamily: 'League Spartan, sans-serif',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '6px 0',
          boxShadow: '0 3px 10px rgba(0,0,0,0.28)',
        }}
      >
        Discount
      </div>
    </div>
  );
};
