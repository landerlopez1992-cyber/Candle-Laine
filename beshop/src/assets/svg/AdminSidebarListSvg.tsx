import * as React from 'react';

/** Solo panel admin: lista / ajustes con estilo MailSvg. */
export const AdminSidebarListSvg: React.FC = () => {
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
      <path
        stroke='#FF4768'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M14 14h12M14 20h12M14 26h8'
      />
    </svg>
  );
};
