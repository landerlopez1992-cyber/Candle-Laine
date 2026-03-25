import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {actions} from '../store/actions';
import {components} from '../components';
import {BRAND_CONTACT} from '../config/brandLinks';
import {APP_PALETTE} from '../theme/appPalette';

const pStory: React.CSSProperties = {
  color: APP_PALETTE.textOnDark,
  lineHeight: 1.7,
  fontSize: 14,
  marginBottom: 16,
  textAlign: 'center',
};

const contactRowBase: React.CSSProperties = {
  paddingLeft: 0,
  display: 'flex',
  marginBottom: 12,
  paddingBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid var(--border-color)',
};

const contactText: React.CSSProperties = {
  marginLeft: 8,
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  fontSize: 13,
  lineHeight: 1.45,
  color: APP_PALETTE.textOnDark,
};

const ContactIconWrap: React.FC<{
  scale?: number;
  children: React.ReactNode;
}> = ({scale = 0.72, children}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    }}
  >
    {children}
  </div>
);

const publicBase = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
const BRAND_LOGO_SRC = `${publicBase}/brand/candle-laine-logo.png`;
const BRAND_STORY_PORTRAIT_SRC = `${publicBase}/brand/elaine-story.jpeg`;

export const BrandStory: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  return (
    <>
      <components.Header
        title='Our story'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: 20,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              marginBottom: 18,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: APP_PALETTE.cartCardSurface,
                border: '1px solid var(--border-color)',
              }}
            >
              <img
                src={BRAND_LOGO_SRC}
                alt='Candle Laine'
                style={{
                  width: 90,
                  height: 90,
                  display: 'block',
                  objectFit: 'contain',
                  backgroundColor: 'transparent',
                }}
              />
            </div>
          </div>
          <h2
            style={{
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: APP_PALETTE.accent,
              marginBottom: 8,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Elaine
          </h2>
          <p
            style={{
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: APP_PALETTE.textMuted,
              fontSize: 12,
              marginBottom: 0,
            }}
          >
            The face behind the products
          </p>
        </div>

        <div
          style={{
            marginTop: 12,
            marginBottom: 20,
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <img
            src={BRAND_STORY_PORTRAIT_SRC}
            alt='Elaine'
            style={{
              width: '100%',
              maxWidth: 220,
              height: 'auto',
              display: 'block',
              borderRadius: 8,
              backgroundColor: 'var(--image-background)',
            }}
          />
        </div>

        <p style={pStory}>
          Have you ever wanted to relive a moment? Capture an emotion, or perhaps
          even its essence? I know I have. Many times throughout my lifetime.
          However, since we can&apos;t time travel yet, our memories are all we
          have. Like a picture captures a moment, fragrance can hold emotions. Our
          memories are very much linked to certain scents. That&apos;s why
          fragrance has always held such a special place in my heart. I&apos;ve
          been a perfume/candle/essential oils etc. fanatic for as long as I can
          remember. One day I decided to take my passion for fragrance further
          than just my bathroom vanity. I decided to be vulnerable, and to
          believe in myself. So, CANDLE-LAINE (did&apos;ya see how I snuck my
          name in there?) was born. These products are an extension of me. I pour
          my heart and soul into them. My hope is that when you light one of my
          candles,
        </p>
        <p style={{...pStory, fontStyle: 'italic', marginBottom: 16}}>
          it takes you to your favorite place.
        </p>
        <p style={{...pStory, marginBottom: 28}}>
          Maybe I have yet to create your special scent, but I would like to.
        </p>

        <section
          style={{
            maxWidth: 280,
            width: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              textTransform: 'capitalize',
              color: APP_PALETTE.accent,
              marginBottom: 14,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Contact us
          </h2>

          <div style={contactRowBase}>
            <ContactIconWrap scale={0.68}>
              <svg.MapPinSvg />
            </ContactIconWrap>
            <div style={contactText}>
              <span className='number-of-lines-2'>
                {BRAND_CONTACT.addressLine1}
              </span>
              <span className='number-of-lines-2'>
                {BRAND_CONTACT.addressLine2}
              </span>
            </div>
          </div>
          <div style={contactRowBase}>
            <ContactIconWrap scale={0.72}>
              <svg.ModalMailSvg />
            </ContactIconWrap>
            <div style={contactText}>
              <span className='number-of-lines-1'>{BRAND_CONTACT.email}</span>
            </div>
          </div>
          <div
            style={{
              ...contactRowBase,
              borderBottom: 'none',
              marginBottom: 0,
              paddingBottom: 0,
            }}
          >
            <ContactIconWrap scale={0.72}>
              <svg.PhoneCallSvg />
            </ContactIconWrap>
            <div style={contactText}>
              <span className='number-of-lines-1'>
                {BRAND_CONTACT.phones[0]}
              </span>
              <span className='number-of-lines-1'>
                {BRAND_CONTACT.phones[1]}
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
