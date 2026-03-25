import type {User} from '@supabase/supabase-js';
import React, {useEffect, useMemo, useRef, useState} from 'react';

import {hooks} from '../../hooks';
import {items} from '../../items';
import {Routes} from '../../enums';
import {svg} from '../../assets/svg';
import {Link} from 'react-router-dom';
import {components} from '../../components';
import {setColor} from '../../store/slices/bgSlice';
import {isSupabaseConfigured, supabase} from '../../supabaseClient';
import {isAdminEmail} from '../../utils/adminAccess';
import {uploadAndSaveProfileAvatar} from '../../utils/uploadProfileAvatar';
import { APP_PALETTE } from '../../theme/appPalette';

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

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
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (!supabase || !user) {
      setProfileRow(null);
      return;
    }
    let cancelled = false;
    void supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({data}) => {
        if (cancelled || !data) {
          return;
        }
        setProfileRow(data as ProfileRow);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) {
      return '';
    }
    const fromProfile = profileRow?.full_name?.trim();
    if (fromProfile) {
      return fromProfile;
    }
    return getDisplayName(user);
  }, [user, profileRow]);

  const initialLetter = useMemo(
    () => (user ? getInitialLetter(displayName) : '?'),
    [user, displayName],
  );

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showLogo={true}
        showBrandMenu={true}
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

    const avatarSrc = profileRow?.avatar_url?.trim();

    const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !user) {
        return;
      }
      setAvatarError(null);
      setAvatarBusy(true);
      const result = await uploadAndSaveProfileAvatar(file, user.id);
      setAvatarBusy(false);
      if (!result.ok) {
        setAvatarError(result.message);
        return;
      }
      setProfileRow((prev) => ({
        full_name: prev?.full_name ?? null,
        avatar_url: result.publicUrl,
      }));
    };

    return (
      <div
        className='container'
        style={{
          display: 'flex',
          marginBottom: 20,
          marginTop: 27,
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <input
          ref={avatarInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          style={{display: 'none'}}
          onChange={onAvatarFile}
        />
        <button
          type='button'
          className='clickable'
          disabled={avatarBusy}
          onClick={() => setShowAvatarMenu(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            width: '100%',
            opacity: avatarBusy ? 0.75 : 1,
          }}
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
            {avatarSrc ? (
              <img
                alt=''
                src={avatarSrc}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  color: 'var(--main-color)',
                }}
              >
                {initialLetter}
              </span>
            )}
          </div>
          <h3 style={{textAlign: 'center'}}>{displayName}</h3>
          <span className='t14'>{user.email ?? ''}</span>
        </button>
        {avatarError ? (
          <p
            className='t14'
            style={{color: '#f0c4b8', marginTop: 8, textAlign: 'center'}}
          >
            {avatarError}
          </p>
        ) : null}
      </div>
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

  const renderAvatarMenu = (): JSX.Element | null => {
    if (!showAvatarMenu) {
      return null;
    }

    /** Matches `renderZellePaymentDialog` in `Checkout.tsx` (cream card, title, compact buttons). */
    const btnZelle: React.CSSProperties = {
      textTransform: 'none',
      fontSize: 16,
      width: '100%',
      maxWidth: 280,
      marginBottom: 0,
    };

    return (
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='avatar-menu-title'
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 102,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
        onClick={() => setShowAvatarMenu(false)}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 336,
            borderRadius: 12,
            border: `1px solid ${APP_PALETTE.border}`,
            backgroundColor: APP_PALETTE.cartCardSurface,
            padding: '24px 22px 20px',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id='avatar-menu-title'
            style={{
              margin: '0 0 10px',
              fontFamily: 'League Spartan, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: '#1C2D18',
              lineHeight: 1.3,
              textAlign: 'center',
            }}
          >
            Profile photo
          </h2>
          <p
            className='t14'
            style={{
              margin: '0 0 16px',
              color: 'var(--text-on-light)',
              lineHeight: 1.55,
              textAlign: 'center',
            }}
          >
            Choose whether to update your photo or edit your profile details.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <components.Button
              text='Change profile photo'
              onClick={() => {
                setShowAvatarMenu(false);
                avatarInputRef.current?.click();
              }}
              containerStyle={btnZelle}
            />
            <components.Button
              text='Edit profile'
              colorScheme='secondary'
              onClick={() => {
                setShowAvatarMenu(false);
                navigate(Routes.EditProfile);
              }}
              containerStyle={btnZelle}
            />
            <components.Button
              text='Cancel'
              colorScheme='secondary'
              onClick={() => setShowAvatarMenu(false)}
              containerStyle={btnZelle}
            />
          </div>
        </div>
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
      {renderAvatarMenu()}
      {renderModal()}
    </>
  );
};
