import * as React from 'react';

/** Solo panel admin: mismo estilo que MailSvg. */
export const AdminSidebarGiftSvg: React.FC = () => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={40}
      height={40}
      fill='none'
    >
      <rect
        width={40}
        height={40}
        fill='#FFF2F5'
        rx={20}
      />
      <g transform='translate(5 5) scale(0.6)'>
        <g
          stroke='#FF4768'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          fill='none'
        >
          <path d='M31.667 25v8.333H18.333V25M33.333 20.833H16.667V25h16.666v-4.167ZM25 33.333v-12.5M25 20.833h-3.75a2.083 2.083 0 1 1 0-4.166c2.917 0 3.75 4.166 3.75 4.166ZM25 20.833h3.75a2.083 2.083 0 0 0 0-4.166c-2.917 0-3.75 4.166-3.75 4.166Z' />
        </g>
      </g>
    </svg>
  );
};
