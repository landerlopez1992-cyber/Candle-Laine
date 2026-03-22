import * as React from 'react';

export const OrderMinusSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={30}
      height={30}
      fill='none'
    >
      <path
        fill='#FAF9FF'
        d='M.5.5h29v29H.5z'
      />
      <path
        stroke='#EEE'
        d='M.5.5h29v29H.5z'
      />
      <path
        stroke='#222'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.2}
        d='M11 15h8.114'
      />
    </svg>
  );
};
