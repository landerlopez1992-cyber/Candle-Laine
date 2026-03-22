import * as React from 'react';

export const OpenArrowSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={11}
      height={6}
      fill='none'
    >
      <g>
        <path
          stroke='#222'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.2}
          d='m.857 1 4.286 4.286L9.429 1'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M10.143 6V.286h-10V6z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
