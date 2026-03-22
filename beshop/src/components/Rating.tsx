import React from 'react';

import {svg} from '../assets/svg';
import {ProductType} from '../types';

type Props = {
  product?: ProductType;
  rating?: number;
  containerStyle?: React.CSSProperties;
};

export const Rating: React.FC<Props> = ({containerStyle, product, rating}) => {
  return (
    <div
      className='row-center'
      style={{...containerStyle}}
    >
      <svg.StarSvg />
      <span
        style={{
          marginTop: 2,
          color: 'var(--text-color)',
          marginLeft: 4,
          fontSize: 12,
          fontFamily: 'Lato',
          lineHeight: 1.7,
        }}
      >
        {product?.rating.toFixed(1)
          ? product.rating.toFixed(1)
          : rating?.toFixed(1)}
      </span>
    </div>
  );
};
