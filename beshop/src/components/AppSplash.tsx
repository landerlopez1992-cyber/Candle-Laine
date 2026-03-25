import React from 'react';

import {APP_PALETTE} from '../theme/appPalette';

/** Duración visible al abrir o refrescar la app (ms). */
export const APP_SPLASH_DURATION_MS = 3600;

/**
 * Marca de vela con llama animada (misma idea que el overlay de checkout; escala mayor).
 */
export const AppSplash: React.FC = () => {
  return (
    <div
      role='presentation'
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: APP_PALETTE.appShell,
        boxSizing: 'border-box',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 112,
          height: 112,
          marginBottom: 28,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 36,
            height: 58,
            borderRadius: '14px 14px 10px 10px',
            background:
              'linear-gradient(180deg, #F5C896 0%, #F1B97F 42%, #C99A6A 100%)',
            boxShadow:
              '0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 58,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 3,
            height: 12,
            background: '#3D2A20',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 68,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 22,
            height: 32,
            borderRadius: '70% 70% 58% 58%',
            background:
              'radial-gradient(ellipse at 50% 75%, #FFE8C8 0%, #F1B97F 35%, #F18B2A 70%, #D86A0E 100%)',
            boxShadow: '0 0 22px rgba(241, 185, 127, 0.65)',
            animation: 'app-splash-flame 1.15s ease-in-out infinite',
          }}
        />
      </div>

      <span
        style={{
          fontFamily: '"Pinyon Script", Georgia, serif',
          fontWeight: 400,
          color: APP_PALETTE.headerTitleLight,
          fontSize: 'clamp(28px, 8vw, 40px)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          lineHeight: 1.15,
        }}
      >
        Candle Laine
      </span>

      <style>{`
        @keyframes app-splash-flame {
          0% {
            transform: translateX(-50%) scale(1) rotate(0deg);
            opacity: 0.94;
            filter: brightness(1);
          }
          50% {
            transform: translateX(-50%) scale(1.1) rotate(-2.5deg);
            opacity: 1;
            filter: brightness(1.08);
          }
          100% {
            transform: translateX(-50%) scale(0.97) rotate(1.5deg);
            opacity: 0.93;
            filter: brightness(0.98);
          }
        }
      `}</style>
    </div>
  );
};
