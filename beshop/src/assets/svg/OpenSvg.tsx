import * as React from 'react';

export const OpenSvg: React.FC = () => {
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
          d='M.857 5.143 5.143.857l4.286 4.286'
        />
      </g>
      <defs>
        <clipPath id='a'>
          <path
            fill='#fff'
            d='M10.143.143v5.714h-10V.143z'
          />
        </clipPath>
      </defs>
    </svg>
  );
};
