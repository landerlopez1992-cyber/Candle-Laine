import * as React from 'react';

type Props = {
  color?: string;
};

export const LineSvg: React.FC<Props> = ({color = '#D05278'}) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={1}
      height={30}
      fill='none'
    >
      <path
        stroke={color}
        strokeDasharray='2 4'
        strokeLinecap='round'
        d='M.5.5v29'
      />
    </svg>
  );
};
