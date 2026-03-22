import React from 'react';

import {ProductType} from '../types';

type Props = {
  product: ProductType;
  containerStyle?: React.CSSProperties;
};

export const Sale: React.FC<Props> = ({
  containerStyle,
  product,
}): JSX.Element | null => {
  if (product.oldPrice) {
    return (
      <div
        style={{
          width: 40,
          height: 16,
          backgroundColor: '#A3D2A2',
          ...containerStyle,
        }}
        className='center'
      >
        <span
          style={{
            fontFamily: 'Lato',
            fontSize: 8,
            textTransform: 'uppercase',
            color: 'var(--white-color)',
          }}
        >
          sale
        </span>
      </div>
    );
  }

  return null;
};
