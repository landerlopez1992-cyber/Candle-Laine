import React from 'react';

import {svg} from '../assets/svg';
import {PromocodeType} from '../types';

type Props = {
  isLast: boolean;
  promocode: PromocodeType;
};

export const PromocodeItem: React.FC<Props> = ({promocode, isLast: _isLast}) => {
  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(promocode.code);
    } catch {
      /* ignore */
    }
  };

  const discountColor = promocode.isFreeShipping
    ? '#4C775C'
    : promocode.discount >= 50
      ? '#FE2121'
      : promocode.discount >= 30
        ? '#EF962D'
        : '#00824B';

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--list-row-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{marginBottom: 12}}>
        <svg.TicketSvg />
      </div>
      <h5
        style={{marginBottom: 3, color: 'var(--main-color)'}}
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
        {promocode.isFreeShipping ? (
          <span
            className='t18 number-of-lines-2'
            style={{
              color: discountColor,
              fontWeight: 700,
            }}
          >
            Free shipping
          </span>
        ) : (
          <span
            className='t18 number-of-lines-1'
            style={{
              color: discountColor,
            }}
          >
            {promocode.discount}% Off
          </span>
        )}
        <span
          style={{marginBottom: 19, color: 'var(--text-color)'}}
          className='t12 number-of-lines-1'
        >
          {promocode.expiry}
        </span>
      </div>
      <button
        type='button'
        className='clickable'
        onClick={copyCode}
        style={{
          display: 'flex',
          padding: '6px 12px',
          alignItems: 'center',
          backgroundColor: 'var(--main-background)',
          justifyContent: 'space-between',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          cursor: 'pointer',
          width: '100%',
          font: 'inherit',
        }}
      >
        <span
          className='t12'
          style={{color: 'var(--main-color)'}}
        >
          {promocode.code}
        </span>
        <svg.CopySvg />
      </button>
    </div>
  );
};
