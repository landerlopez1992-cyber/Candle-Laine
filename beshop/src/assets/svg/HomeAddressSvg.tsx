import * as React from 'react';

export const HomeAddressSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={50}
      height={50}
      fill='none'
    >
      <path
        fill='#FAF9FF'
        d='M.5.5h49v49H.5z'
      />
      <path
        stroke='#EEE'
        d='M.5.5h49v49H.5z'
      />
      <path
        stroke='#222'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='m17.5 22.5 7.5-5.833 7.5 5.833v9.167a1.667 1.667 0 0 1-1.667 1.666H19.167a1.667 1.667 0 0 1-1.667-1.666V22.5Z'
      />
      <path
        stroke='#222'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M22.5 33.333V25h5v8.333'
      />
    </svg>
  );
};
