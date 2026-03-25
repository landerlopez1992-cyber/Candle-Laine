import * as React from 'react';

import {APP_PALETTE} from '../../theme/appPalette';

const wordmarkStyle: React.CSSProperties = {
  fontFamily: '"Pinyon Script", Georgia, serif',
  fontWeight: 400,
  color: APP_PALETTE.headerTitleLight,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
  fontSize: 'clamp(14px, 4vw, 22px)',
};

/** Wordmark script sobre cabecera oscura; contraste con `headerTitleLight`. */
export const HeaderLogoSvg: React.FC = () => {
  return (
    <span style={wordmarkStyle} aria-label='Candle Laine'>
      Candle Laine
    </span>
  );
};
