import * as React from 'react';
import {useSelector} from 'react-redux';

import {RootState} from '../../store';
import {ProductType} from '../../types';

type Props = {
  product: ProductType;
  style?: React.CSSProperties;
};

export const HeartSvg: React.FC<Props> = ({product, style}) => {
  const wishlist = useSelector((state: RootState) => state.wishlistSlice);

  const ifInWishlist = wishlist.list.find((item) => item.id === product.id);

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={14}
      height={13}
      fill={ifInWishlist ? 'var(--accent-color)' : 'transparent'}
    >
      <g>
        <path
          stroke={ifInWishlist ? 'var(--accent-color)' : 'var(--main-color)'}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={0.929}
          d='M11.712 2.294a2.931 2.931 0 0 0-4.147 0L7 2.859l-.565-.565A2.933 2.933 0 0 0 2.288 6.44l.565.565L7 11.153l4.147-4.147.565-.565a2.931 2.931 0 0 0 0-4.147v0Z'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M.5.258h13V12.33H.5z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
