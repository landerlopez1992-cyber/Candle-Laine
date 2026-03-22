import React from 'react';
import PuffLoader from 'react-spinners/PuffLoader';

export const Loader: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--main-background)',
        zIndex: 1000,
        flex: 1,
      }}
    >
      <PuffLoader
        size={40}
        color={'#455A81'}
        aria-label='Loading Spinner'
        data-testid='loader'
        speedMultiplier={1}
      />
    </div>
  );
};
