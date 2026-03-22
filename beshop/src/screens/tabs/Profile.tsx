import React, {useEffect, useState} from 'react';

import {hooks} from '../../hooks';
import {items} from '../../items';
import {Routes} from '../../enums';
import {svg} from '../../assets/svg';
import {Link} from 'react-router-dom';
import {components} from '../../components';
import {setColor} from '../../store/slices/bgSlice';

export const Profile: React.FC = () => {
  hooks.useThemeColor('#FCEDEA');

  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(setColor('#FCEDEA'));
  }, [dispatch]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showLogo={true}
        title='My Profile'
        showBasket={true}
        headerStyle={{
          backgroundColor: '#FCEDEA',
        }}
      />
    );
  };

  const renderUserInfo = (): JSX.Element => {
    return (
      <Link
        style={{
          display: 'inline-flex',
          marginBottom: 20,
          marginTop: 27,
          flexDirection: 'column',
          alignItems: 'center',
        }}
        to='/profile/edit'
        className='container clickable'
      >
        <div
          style={{
            width: 96,
            height: 96,
            alignSelf: 'center',
            border: '6px solid var(--accent-color)',
            borderRadius: '50%',
            marginBottom: 16,
          }}
        >
          <img
            alt='user'
            src='https://george-fx.github.io/beshop_api/assets/users/01.jpg'
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
            }}
          />
        </div>
        <h3>Kristin Watson</h3>
        <span className='t14'>kristinwatson@mail.com</span>
      </Link>
    );
  };

  const renderProfileMenu = (): JSX.Element => {
    return (
      <div
        className='container'
        style={{paddingBottom: 20}}
      >
        <items.ProfileItem
          title='Order history'
          icon={<svg.CalendarSvg />}
          to={Routes.OrderHistory}
        />
        <items.ProfileItem
          title='Payment method'
          to={Routes.PaymentMethod}
          icon={<svg.CreditCardSvg />}
        />
        <items.ProfileItem
          title='My address'
          icon={<svg.MapPinSvg />}
          to={Routes.MyAddress}
        />
        <items.ProfileItem
          to={Routes.MyPromocodes}
          // to={Routes.MyPromocodesEmpty}
          title={'My promocodes'}
          icon={<svg.GiftSvg />}
        />
        <items.ProfileItem
          to={Routes.TrackYourOrder}
          title={'Track my order'}
          icon={<svg.TruckSvg />}
        />
        <items.ProfileItem
          title='FAQ'
          to={Routes.FAQ}
          icon={<svg.HelpCircleSvg />}
        />
        <items.ProfileItem
          isButton={true}
          title='Sign out'
          icon={<svg.LogOutSvg />}
          onClick={() => {
            setShowModal(true);
          }}
          isLast={true}
        />
      </div>
    );
  };

  const renderModal = (): JSX.Element | null => {
    if (!showModal) return null;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(30, 37, 56, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            width: 'calc(100% - 40px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 44,
            paddingBottom: 40,
            backgroundColor: 'var(--pastel-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src='https://george-fx.github.io/beshop_api/assets/other/02.png'
            alt=''
            style={{
              width: '66%',
              objectFit: 'contain',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: 30,
            }}
          />
          <h3
            style={{
              textAlign: 'center',
              textTransform: 'capitalize',
              marginBottom: 20,
            }}
          >
            Are you sure you want <br /> to sign out ?
          </h3>
          <div
            className='row-center'
            style={{gap: 15}}
          >
            <components.Button
              text='sure'
              colorScheme='secondary'
              onClick={() => {
                setShowModal(false);
                navigate(Routes.SignIn);
              }}
            />
            <components.Button
              text='Cancel'
              onClick={() => setShowModal(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{backgroundColor: 'var(--white-color)'}}
      >
        {renderUserInfo()}
        {renderProfileMenu()}
      </main>
    );
  };

  const renderFooter = (): JSX.Element => {
    return <components.Footer />;
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
      {renderModal()}
    </>
  );
};
