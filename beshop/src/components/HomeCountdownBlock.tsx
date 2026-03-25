import React, {useEffect, useMemo, useState} from 'react';

import {hooks} from '../hooks';
import {APP_PALETTE} from '../theme/appPalette';
import type {HomeCountdownDisplay} from '../hooks/useHomeCountdown';

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function splitRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (ms <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0};
  }
  const days = Math.floor(ms / 86400000);
  let rest = ms - days * 86400000;
  const hours = Math.floor(rest / 3600000);
  rest -= hours * 3600000;
  const minutes = Math.floor(rest / 60000);
  rest -= minutes * 60000;
  const seconds = Math.floor(rest / 1000);
  return {days, hours, minutes, seconds};
}

type Props = {
  data: HomeCountdownDisplay;
};

export const HomeCountdownBlock: React.FC<Props> = ({data}) => {
  const navigate = hooks.useNavigate();
  const [now, setNow] = useState(() => Date.now());

  const endMs = useMemo(
    () => new Date(data.endsAtIso).getTime(),
    [data.endsAtIso],
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endMs - now);
  if (remaining <= 0) {
    return null;
  }

  const {days, hours, minutes, seconds} = splitRemaining(remaining);

  const onBuy = () => {
    navigate(`/product/${data.product.id}`, {state: {product: data.product}});
  };

  const unitStyle: React.CSSProperties = {
    minWidth: 56,
    padding: '10px 8px',
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    border: `1px solid ${APP_PALETTE.border}`,
    textAlign: 'center',
  };

  const numStyle: React.CSSProperties = {
    fontFamily: 'League Spartan, sans-serif',
    fontSize: 22,
    fontWeight: 700,
    color: APP_PALETTE.accent,
    lineHeight: 1.1,
  };

  const labStyle: React.CSSProperties = {
    fontFamily: 'Lato, sans-serif',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.06,
    textTransform: 'uppercase',
    color: APP_PALETTE.textMuted,
    marginTop: 4,
  };

  return (
    <section
      style={{
        position: 'relative',
        marginBottom: 40,
        marginLeft: 20,
        marginRight: 20,
        paddingTop: 20,
        paddingBottom: 22,
        paddingLeft: 18,
        paddingRight: 18,
        borderRadius: 14,
        backgroundColor: APP_PALETTE.appShell,
        border: `1px solid ${APP_PALETTE.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 88,
          height: 88,
          borderRadius: 12,
          backgroundColor: APP_PALETTE.imageWell,
          border: `1px solid ${APP_PALETTE.border}`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <img
          src={data.product.image}
          alt=''
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      <div style={{paddingRight: 102}}>
        {data.bodyText ? (
          <p
            className='t14'
            style={{
              margin: '0 0 14px',
              color: APP_PALETTE.textOnDark,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {data.bodyText}
          </p>
        ) : (
          <p
            className='t14'
            style={{
              margin: '0 0 14px',
              color: APP_PALETTE.textMuted,
              fontStyle: 'italic',
            }}
          >
            Limited time offer
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          marginBottom: 16,
          paddingRight: 4,
        }}
      >
        <div style={unitStyle}>
          <div style={numStyle}>{pad2(days)}</div>
          <div style={labStyle}>Days</div>
        </div>
        <div style={unitStyle}>
          <div style={numStyle}>{pad2(hours)}</div>
          <div style={labStyle}>Hours</div>
        </div>
        <div style={unitStyle}>
          <div style={numStyle}>{pad2(minutes)}</div>
          <div style={labStyle}>Min</div>
        </div>
        <div style={unitStyle}>
          <div style={numStyle}>{pad2(seconds)}</div>
          <div style={labStyle}>Sec</div>
        </div>
      </div>

      <button
        type='button'
        className='clickable'
        onClick={onBuy}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 320,
          padding: '12px 18px',
          borderRadius: 10,
          border: `1px solid ${APP_PALETTE.accent}`,
          backgroundColor: APP_PALETTE.accent,
          color: '#1C2D18',
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 0.08,
          textTransform: 'uppercase',
        }}
      >
        {data.buttonLabel || 'Buy now'}
      </button>
    </section>
  );
};
