import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import {hooks} from '../hooks';
import {svg} from '../assets/svg';
import {RootState} from '../store';
import {Screens, Routes} from '../enums';
import {setScreen} from '../store/slices/tabSlice';
import {APP_PALETTE} from '../theme/appPalette';
import {BRAND_CONTACT} from '../config/brandLinks';
import {getCartCheckoutTotals} from '../utils/cartPaymentTotals';

type Props = {
  title?: string;
  search?: boolean;
  showLogo?: boolean;
  showGoBack?: boolean;
  showBasket?: boolean;
  headerStyle?: React.CSSProperties;
};

function isLightHeaderBackground(bg: unknown): boolean {
  if (bg == null || typeof bg !== 'string') {
    return false;
  }
  const s = bg.toLowerCase().trim();
  return (
    s === '#fff' ||
    s === '#ffffff' ||
    s === 'white' ||
    s === 'rgb(255, 255, 255)' ||
    s === 'var(--white-color)'
  );
}

export const Header: React.FC<Props> = ({
  title,
  search,
  showLogo,
  showGoBack,
  showBasket,
  headerStyle,
}) => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  const currentScreen = useSelector(
    (state: RootState) => state.tabSlice.screen,
  );

  const [showModal, setShowModal] = useState(false);
  const [themeColor, setThemeColor] = useState(APP_PALETTE.appShell);

  hooks.useThemeColor(themeColor);

  const cart = useSelector((state: RootState) => state.cartSlice);
  const cartTotals = getCartCheckoutTotals(cart);

  const renderLogo = (): JSX.Element | null => {
    if (!showLogo) return null;

    return (
      <button
        style={{
          height: '100%',
          width: 'auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
        }}
        className='clickable'
        onClick={() => {
          setThemeColor(APP_PALETTE.appShell);
          setShowModal(true);
        }}
      >
        <svg.HeaderLogoSvg />
      </button>
    );
  };

  const renderGoBack = (): JSX.Element | null => {
    if (!showGoBack) {
      return null;
    }
    return (
      <div
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            dispatch(setScreen(Screens.Profile));
            navigate(Routes.TabNavigator);
          }
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
        }}
        className='clickable'
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).click();
          }
        }}
      >
        <svg.GoBackSvg />
      </div>
    );
  };

  const headerBackground =
    headerStyle?.backgroundColor !== undefined
      ? headerStyle.backgroundColor
      : 'var(--main-background)';
  const titleColor = isLightHeaderBackground(headerBackground)
    ? 'var(--main-color)'
    : APP_PALETTE.headerTitleLight;

  const renderTitle = (): JSX.Element | null => {
    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <h4 style={{marginBottom: 0, color: titleColor}}>{title}</h4>
      </div>
    );
  };

  const renderSearch = (): JSX.Element | null => {
    if (!search) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          height: '100%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg.SearchHeaderSvg />
      </div>
    );
  };

  const renderBasket = (): JSX.Element | null => {
    if (!showBasket) return null;

    return (
      <button
        type='button'
        data-fly-cart-target='true'
        onClick={() => {
          dispatch(setScreen(Screens.Cart));
          navigate(Routes.TabNavigator);
        }}
        style={{
          height: '100%',
          width: 'auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          right: 0,
        }}
      >
        <div
          className='t10'
          style={{
            position: 'absolute',
            backgroundColor: 'var(--accent-color)',
            padding: '5px 4px 3px 4px',
            borderRadius: '12px',
            bottom: 9,
            right: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontFamily: 'Lato',
              fontWeight: 700,
              marginBottom: 1,
            }}
          >
            ${cartTotals.grandTotal > 0 ? cartTotals.grandTotal.toFixed(2) : '0'}
          </span>
        </div>
        <svg.BasketSvg />
      </button>
    );
  };

  const renderModal = (): JSX.Element | null => {
    if (!showModal) return null;
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(30, 37, 56, 0.6)',
            zIndex: 101,
            cursor: 'pointer',
          }}
          onClick={() => {
            if (currentScreen === 'Wishlist') {
              setThemeColor(APP_PALETTE.appShell);
            }

            if (currentScreen === 'Home') {
              setThemeColor(APP_PALETTE.appShell);
            }

            setShowModal(false);
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '72%',
            backgroundColor: 'var(--main-background)',
            zIndex: 101,
          }}
        >
          <div
            style={{
              paddingTop: '20%',
              paddingLeft: 20,
              paddingRight: 20,
              marginBottom: 27,
            }}
          >
            <h2 style={{textTransform: 'capitalize'}}>Contact us</h2>
          </div>
          {/* Address */}
          <div
            style={{
              paddingLeft: 20,
              display: 'flex',
              marginBottom: 20,
              paddingBottom: 20,
              flexDirection: 'row',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <svg.MapPinSvg />
            <div
              style={{
                marginLeft: 8,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span className='t18 number-of-lines-1'>
                {BRAND_CONTACT.addressLine1}
              </span>
              <span className='t18 number-of-lines-1'>
                {BRAND_CONTACT.addressLine2}
              </span>
            </div>
          </div>
          {/* Email */}
          <div
            style={{
              paddingLeft: 20,
              display: 'flex',
              marginBottom: 20,
              paddingBottom: 20,
              flexDirection: 'row',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <svg.ModalMailSvg />
            <div
              style={{
                marginLeft: 8,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span className='t18 number-of-lines-1'>
                {BRAND_CONTACT.email}
              </span>
            </div>
          </div>
          {/* Phone */}
          <div
            style={{
              paddingLeft: 20,
              display: 'flex',
              paddingBottom: 20,
              flexDirection: 'row',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <svg.PhoneCallSvg />
            <div
              style={{
                marginLeft: 8,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span className='t18 number-of-lines-1'>
                {BRAND_CONTACT.phones[0]}
              </span>
              <span className='t18 number-of-lines-1'>
                {BRAND_CONTACT.phones[1]}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <header
        style={{
          position: 'relative',
          minHeight: 'calc(var(--header-height) + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          boxSizing: 'border-box',
          backgroundColor: 'var(--main-background)',
          ...headerStyle,
        }}
        className='row-center-space-between'
      >
        {renderLogo()}
        {renderGoBack()}
        {renderTitle()}
        {renderSearch()}
        {renderBasket()}
      </header>
      {renderModal()}
    </>
  );
};
