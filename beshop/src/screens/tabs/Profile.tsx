import type {User} from '@supabase/supabase-js';
import React, {useEffect, useMemo, useState} from 'react';

import {hooks} from '../../hooks';
import {items} from '../../items';
import {Routes} from '../../enums';
import {svg} from '../../assets/svg';
import {Link} from 'react-router-dom';
import {components} from '../../components';
import {setColor} from '../../store/slices/bgSlice';
import {isSupabaseConfigured, supabase} from '../../supabaseClient';
import {isAdminEmail} from '../../utils/adminAccess';
import { APP_PALETTE } from '../../theme/appPalette';

function getDisplayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName =
    typeof meta?.full_name === 'string' ? meta.full_name.trim() : '';
  if (fullName) {
    return fullName;
  }
  const email = user.email ?? '';
  const local = email.split('@')[0];
  return local || 'Account';
}

function getInitialLetter(displayName: string): string {
  const ch = displayName.trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

export const Profile: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);

  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    dispatch(setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    supabase.auth.getSession().then(({data: {session}}) => {
      setUser(session?.user ?? null);
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = useMemo(
    () => (user ? getDisplayName(user) : ''),
    [user],
  );

  const initialLetter = useMemo(
    () => (user ? getInitialLetter(displayName) : '?'),
    [user, displayName],
  );

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showLogo={true}
        title='My Profile'
        showBasket={true}
        headerStyle={{
          backgroundColor: APP_PALETTE.headerBand,
        }}
      />
    );
  };

  const renderUserInfo = (): JSX.Element => {
    if (!isSupabaseConfigured) {
      return (
        <div
          className='container'
          style={{marginTop: 27, marginBottom: 20, textAlign: 'center'}}
        >
          <p className='t16'>Connect Supabase in your environment to load your profile.</p>
        </div>
      );
    }

    if (!user) {
      return (
        <Link
          style={{
            display: 'inline-flex',
            marginBottom: 20,
            marginTop: 27,
            flexDirection: 'column',
            alignItems: 'center',
          }}
          to={Routes.SignIn}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--pastel-color)',
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 600,
                color: 'var(--main-color)',
              }}
            >
              ?
            </span>
          </div>
          <h3>Sign in</h3>
          <span className='t14'>Use your email to see your account here</span>
        </Link>
      );
    }

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--pastel-color)',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: 'var(--main-color)',
            }}
          >
            {initialLetter}
          </span>
        </div>
        <h3 style={{textAlign: 'center'}}>{displayName}</h3>
        <span className='t14'>{user.email ?? ''}</span>
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
          to={Routes.OrderHistory}
          title={'Track my order'}
          icon={<svg.TruckSvg />}
        />
        {user?.email && isAdminEmail(user.email) && (
          <items.ProfileItem
            title='Admin'
            to={Routes.Admin}
            icon={<svg.BriefcaseSvg />}
          />
        )}
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
              onClick={async () => {
                setShowModal(false);
                if (supabase) {
                  await supabase.auth.signOut();
                }
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
        style={{backgroundColor: 'var(--main-background)'}}
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
