import * as React from 'react';

export const PaymentPlusSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={16}
      height={16}
      fill='none'
    >
      <g
        stroke='#222'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.2}
      >
        <path d='M8 1.583v12.834M1.624 8h12.752' />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M0 0h16v16H0z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
