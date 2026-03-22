import React from 'react';

type Props = {
  selected: boolean;
};

export const Select: React.FC<Props> = ({selected}) => {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        border: '2px solid var(--border-color)',
      }}
    >
      {selected && (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: 'var(--accent-color)',
            margin: 'auto',
          }}
        ></div>
      )}
    </div>
  );
};
