import * as React from 'react';

import {APP_PALETTE} from '../../theme/appPalette';

const wordmarkStyle: React.CSSProperties = {
  fontFamily: '"Pinyon Script", Georgia, serif',
  fontWeight: 400,
  color: APP_PALETTE.headerTitleLight,
  lineHeight: 1.1,
  textAlign: 'center',
  display: 'block',
  fontSize: 'clamp(24px, 6.5vw, 38px)',
};

export const LogoSvg: React.FC = () => {
  return (
    <span style={wordmarkStyle} aria-label='Candle Laine'>
      Candle Laine
    </span>
  );
};
