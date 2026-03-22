import * as React from 'react';

export const BriefcaseSvg: React.FC = () => {
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
        d='M31.667 20.833H18.333c-.92 0-1.666.746-1.666 1.667v8.333c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.746 1.666-1.667V22.5c0-.92-.746-1.667-1.666-1.667Z'
      />
      <path
        stroke='#222'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M28.333 32.5V19.167a1.666 1.666 0 0 0-1.666-1.667h-3.334a1.666 1.666 0 0 0-1.666 1.667V32.5'
      />
    </svg>
  );
};
