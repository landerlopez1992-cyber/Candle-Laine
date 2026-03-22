import React from 'react';

import {ProductType} from '../types';

type Props = {
  product: ProductType;
  containerStyle?: React.CSSProperties;
};

export const Price: React.FC<Props> = ({product, containerStyle}) => {
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
            color: '#999999',
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
          color: product.oldPrice ? 'var(--accent-color)' : 'var(--text-color)',
        }}
      >
        ${product.price}
      </span>
    </div>
  );
};
