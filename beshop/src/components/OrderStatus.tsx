import React from 'react';

import {svg} from '../assets/svg';

type Props = {
  status: string;
  confirmed?: boolean;
  description: string;
  currentStatus?: boolean;
  containerStyle?: React.CSSProperties;
};

export const OrderStatus: React.FC<Props> = ({
  containerStyle,
  status,
  confirmed,
  description,
  currentStatus,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 24,
        marginLeft: '16%',
        ...containerStyle,
      }}
    >
      {/* Left Blcok */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            border: `2px solid ${
              currentStatus ? 'var(--accent-color)' : '#999999'
            }`,
          }}
          className='center'
        >
          {confirmed && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: `${
                  currentStatus ? 'var(--accent-color)' : 'var(--main-color)'
                }`,
              }}
            />
          )}
          {currentStatus && (
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: `${
                  currentStatus ? 'var(--accent-color)' : 'var(--main-color)'
                }`,
              }}
            />
          )}
        </div>
        {status !== 'Receiving' && (
          <div
            style={{
              marginTop: 6,
              marginBottom: 6,
            }}
          >
            <svg.LineSvg
              color={confirmed ? 'var(--accent-color)' : '#999999'}
            />
          </div>
        )}
      </div>
      {/* Right Block */}
      <div>
        <h5
          style={{marginBottom: 6}}
          className='number-of-lines-1'
        >
          {status}
        </h5>
        <span className='t14'>{description}</span>
      </div>
    </div>
  );
};
