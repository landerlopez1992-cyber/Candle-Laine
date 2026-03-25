import * as React from 'react';

/** Tres puntos verticales (menú / opciones); usa `color` del contenedor (`currentColor`). */
export const MoreVerticalSvg: React.FC = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width={20}
    height={20}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden
  >
    <circle
      cx='12'
      cy='5'
      r='2'
      fill='currentColor'
    />
    <circle
      cx='12'
      cy='12'
      r='2'
      fill='currentColor'
    />
    <circle
      cx='12'
      cy='19'
      r='2'
      fill='currentColor'
    />
  </svg>
);
