import React from 'react';
import PuffLoader from 'react-spinners/PuffLoader';

import {APP_PALETTE} from '../theme/appPalette';

type Props = {
  spinnerColor?: string;
};

export const Loader: React.FC<Props> = ({spinnerColor = APP_PALETTE.spinner}) => {
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
        color={spinnerColor}
        aria-label='Loading Spinner'
        data-testid='loader'
        speedMultiplier={1}
      />
    </div>
  );
};
