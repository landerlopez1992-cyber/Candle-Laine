import * as React from 'react';

export const RightArrowSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={6}
      height={10}
      fill='none'
    >
      <g>
        <path
          stroke='#222'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='m1 9 4-4-4-4'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M0 0h6v10H0z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
