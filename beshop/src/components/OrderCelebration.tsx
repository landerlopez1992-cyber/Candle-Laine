import React, {useMemo} from 'react';

import {APP_PALETTE} from '../theme/appPalette';

const CONFETTI_COLORS = [
  APP_PALETTE.accent,
  APP_PALETTE.accentJade,
  '#F5E6D3',
  '#E8A87C',
  '#D4A574',
  '#FFFFFF',
];

/**
 * Confeti y destellos (solo lectura) para la pantalla de pedido creado.
 */
export const OrderCelebration: React.FC = () => {
  const pieces = useMemo(
    () =>
      Array.from({length: 52}, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 2.2,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        w: 5 + Math.random() * 7,
        h: 7 + Math.random() * 9,
      })),
    [],
  );

  const sparkles = useMemo(
    () =>
      Array.from({length: 14}, (_, i) => ({
        id: `sp-${i}`,
        top: `${12 + Math.random() * 58}%`,
        left: `${8 + Math.random() * 84}%`,
        delay: Math.random() * 1.5,
        duration: 1.1 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <>
      <style>{`
        @keyframes orderConfettiFall {
          0% {
            transform: translateY(-24px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.85;
          }
        }
        @keyframes orderSparklePulse {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.65);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              top: -24,
              left: p.left,
              width: p.w,
              height: p.h,
              backgroundColor: p.color,
              borderRadius: 2,
              animation: `orderConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              opacity: 0.95,
            }}
          />
        ))}
        {sparkles.map((s) => (
          <span
            key={s.id}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              fontSize: 22,
              lineHeight: 1,
              animation: `orderSparklePulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
              filter: 'drop-shadow(0 0 8px rgba(241, 185, 127, 0.95))',
            }}
          >
            ✨
          </span>
        ))}
      </div>
    </>
  );
};
