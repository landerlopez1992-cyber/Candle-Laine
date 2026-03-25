import React from 'react';

import {ProductType} from '../types';

type Props = {
  product: ProductType;
  containerStyle?: React.CSSProperties;
  /** Contraste sobre tarjetas crema (carrito). */
  variant?: 'default' | 'onLight';
};

export const Price: React.FC<Props> = ({
  product,
  containerStyle,
  variant = 'default',
}) => {
  const onLight = variant === 'onLight';
  const muted = onLight ? 'var(--price-muted)' : 'var(--price-muted, #999999)';
  const main = onLight
    ? product.oldPrice
      ? 'var(--accent-color)'
      : 'var(--text-on-light)'
    : product.oldPrice
      ? 'var(--accent-color)'
      : 'var(--text-color)';

  return (
    <div
      className='row-center'
      style={{...containerStyle}}
    >
      {product.oldPrice && (
        <span
          style={{
            marginRight: 4,
            fontSize: 10,
            color: muted,
            fontFamily: 'Lato',
            lineHeight: 1.5,
            marginTop: 2,
            textDecoration: 'line-through',
          }}
        >
          ${product.oldPrice}
        </span>
      )}
      <span
        style={{
          fontWeight: 700,
          fontFamily: 'Lato',
          fontSize: 14,
          lineHeight: 1.5,
          color: main,
        }}
      >
        ${product.price}
      </span>
    </div>
  );
};
