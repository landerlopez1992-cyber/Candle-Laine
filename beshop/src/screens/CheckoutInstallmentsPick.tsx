import React, {useEffect} from 'react';

import {svg} from '../assets/svg';
import {Routes} from '../enums';
import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {bnplLogoUrl} from '../config/paymentLogos';

const rowButtonStyle: React.CSSProperties = {
  padding: '12px 14px',
  marginBottom: 10,
  width: '100%',
  maxWidth: '100%',
  borderRadius: 8,
  border: `1px solid ${APP_PALETTE.border}`,
  backgroundColor: APP_PALETTE.cartCardSurface,
  cursor: 'pointer',
  textAlign: 'left',
};

/** Ancho máximo de las filas (evita barras casi a todo el ancho en móvil ancho). */
const rowsWrapStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 320,
  marginLeft: 'auto',
  marginRight: 'auto',
};

export const CheckoutInstallmentsPick: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const goDetail = (installmentsProvider: 'affirm' | 'klarna') => {
    navigate(Routes.CheckoutPaymentDetail, {
      state: {method: 'installments', installmentsProvider},
    });
  };

  return (
    <>
      <components.Header
        showGoBack={true}
        title='Pay in installments'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
      <main
        className='scrollable'
        style={{
          padding: 20,
          paddingBottom: 28,
          backgroundColor: APP_PALETTE.appShell,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        <p
          className='t14'
          style={{
            color: APP_PALETTE.textMuted,
            marginBottom: 16,
            lineHeight: 1.55,
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Choose a provider. You will finish the application on their secure page,
          then return here.
        </p>

        <div style={rowsWrapStyle}>
          <button
            type='button'
            aria-label='Continue with Affirm'
            style={{
              ...rowButtonStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
            className='row-center-space-between'
            onClick={() => goDetail('affirm')}
          >
            <div
              className='row-center'
              style={{gap: 10, minWidth: 0, flex: 1}}
            >
              <img
                src={bnplLogoUrl('affirm')}
                alt=''
                aria-hidden
                style={{
                  height: 26,
                  width: 'auto',
                  maxWidth: 72,
                  maxHeight: 28,
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <h5
                style={{
                  color: 'var(--text-on-light)',
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 17,
                }}
              >
                Affirm
              </h5>
            </div>
            <span style={{display: 'flex', opacity: 0.55, flexShrink: 0}} aria-hidden>
              <svg.RightArrowSvg />
            </span>
          </button>

          <button
            type='button'
            aria-label='Continue with Klarna'
            style={{
              ...rowButtonStyle,
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
            className='row-center-space-between'
            onClick={() => goDetail('klarna')}
          >
            <div
              className='row-center'
              style={{gap: 10, minWidth: 0, flex: 1}}
            >
              <img
                src={bnplLogoUrl('klarna')}
                alt=''
                aria-hidden
                style={{
                  height: 26,
                  width: 'auto',
                  maxWidth: 72,
                  maxHeight: 28,
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <h5
                style={{
                  color: 'var(--text-on-light)',
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 17,
                }}
              >
                Klarna
              </h5>
            </div>
            <span style={{display: 'flex', opacity: 0.55, flexShrink: 0}} aria-hidden>
              <svg.RightArrowSvg />
            </span>
          </button>
        </div>
      </main>
    </>
  );
};
