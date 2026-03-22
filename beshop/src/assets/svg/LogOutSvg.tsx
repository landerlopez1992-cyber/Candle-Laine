import * as React from 'react';

export const LogOutSvg: React.FC = () => {
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
        d='M22.5 32.5h-3.333a1.666 1.666 0 0 1-1.667-1.667V19.167a1.666 1.666 0 0 1 1.667-1.667H22.5M28.333 29.167 32.5 25l-4.167-4.167M32.5 25h-10'
      />
    </svg>
  );
};
