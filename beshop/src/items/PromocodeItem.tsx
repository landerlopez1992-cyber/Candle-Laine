import React from 'react';

import {svg} from '../assets/svg';
import {PromocodeType} from '../types';

type Props = {
  isLast: boolean;
  promocode: PromocodeType;
};

export const PromocodeItem: React.FC<Props> = ({promocode, isLast}) => {
  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--white-color)',
        border: '1px solid var(--border-color)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
      }}
      className='clickable'
      onClick={() => {
        alert(`${promocode.name} code copied to clipboard`);
      }}
    >
      <div style={{marginBottom: 12}}>
        <svg.TicketSvg />
      </div>
      <h5
        style={{marginBottom: 3}}
        className='number-of-lines-1'
      >
        {promocode.name}
      </h5>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginRight: 'auto',
        }}
      >
        <span
          className='t18 number-of-lines-1'
          style={{
            color:
              promocode.discount >= 50
                ? '#FE2121'
                : promocode.discount >= 30
                ? '#EF962D'
                : '#00824B',
          }}
        >
          {promocode.discount}% Off
        </span>
        <span
          style={{marginBottom: 19}}
          className='t12 number-of-lines-1'
        >
          {promocode.expiry}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          padding: '6px 12px',
          alignItems: 'center',
          backgroundColor: '#FAF9FF',
          justifyContent: 'space-between',
          border: '1px solid var(--border-color)',
        }}
      >
        <span className='t12'>{promocode.code}</span>
        <svg.CopySvg />
      </div>
    </div>
  );
};
