import type {User} from '@supabase/supabase-js';
import React, {useCallback, useEffect, useState} from 'react';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {components} from '../components';
import {actions} from '../store/actions';
import {Routes} from '../enums';
import {supabase, isSupabaseConfigured} from '../supabaseClient';
import {APP_PALETTE} from '../theme/appPalette';
import {
  COUNTRY_SELECT_OPTIONS,
  normalizeLocationToCountryCode,
} from '../constants/countries';

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

export const EditProfile: React.FC = () => {
  const navigate = hooks.useNavigate();
  const dispatch = hooks.useDispatch();

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  /** ISO 3166-1 alpha-2; stored in `profiles.location`. */
  const [countryCode, setCountryCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase.auth.getUser().then(({data: {user: u}}) => {
      setUser(u ?? null);
      if (!u) {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      navigate(Routes.SignIn, {replace: true});
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!supabase || !user) {
      return;
    }
    let cancelled = false;
    void supabase
      .from('profiles')
      .select('full_name, phone, location, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({data, error: qErr}) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        if (qErr || !data) {
          setFullName(getDisplayName(user));
          return;
        }
        const row = data as {
          full_name: string | null;
          phone: string | null;
          location: string | null;
          avatar_url: string | null;
        };
        setFullName(
          (row.full_name && row.full_name.trim()) || getDisplayName(user),
        );
        setPhone(row.phone?.trim() ?? '');
        setCountryCode(
          normalizeLocationToCountryCode(row.location ?? '') || '',
        );
        setAvatarUrl(row.avatar_url?.trim() || null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = useCallback(async () => {
    setError(null);
    if (!supabase || !user) {
      setError('Sign in to save your profile.');
      return;
    }
    setSaving(true);
    const phoneClean = phone.replace(/\s+/g, ' ').trim();
    const {error: upErr} = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone: phoneClean || null,
        location: countryCode.trim() || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (upErr) {
      setError(upErr.message || 'Could not save.');
      return;
    }
    navigate(-1);
  }, [countryCode, fullName, navigate, phone, user]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Edit Profile'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--main-background)',
          zIndex: 10,
        }}
      >
        {renderHeader()}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <p className='t16' style={{color: APP_PALETTE.textOnDark}}>
            Loading…
          </p>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--main-background)',
        zIndex: 10,
        maxWidth: 'var(--screen-width)',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {renderHeader()}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: 20,
          paddingBottom: 'max(28px, env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--input-background)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              alignSelf: 'center',
              border: '4px solid var(--accent-color)',
              borderRadius: '50%',
              margin: '0 auto',
              marginBottom: 24,
              overflow: 'hidden',
              backgroundColor: 'var(--pastel-color)',
            }}
          >
            {avatarUrl ? (
              <img
                alt=''
                src={avatarUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontWeight: 600,
                  color: 'var(--main-color)',
                }}
              >
                {(fullName.trim().charAt(0) || user?.email?.charAt(0) || '?').toUpperCase()}
              </div>
            )}
          </div>
          <custom.InputField
            placeholder='Full name'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            containerStyle={{marginBottom: 10}}
          />
          <custom.InputField
            placeholder='Email'
            value={user?.email ?? ''}
            onChange={() => {}}
            disabled
            maxLength={120}
            containerStyle={{marginBottom: 10, opacity: 0.85}}
          />
          <custom.InputField
            placeholder='Phone'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode='tel'
            autoComplete='tel'
            maxLength={24}
            containerStyle={{marginBottom: 10}}
          />
          <custom.SelectField
            placeholder='Country'
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            options={COUNTRY_SELECT_OPTIONS}
            containerStyle={{marginBottom: 18}}
          />
          {error ? (
            <p
              className='t14'
              style={{color: '#b00020', marginBottom: 12, textAlign: 'center'}}
            >
              {error}
            </p>
          ) : null}
          <components.Button
            text={saving ? 'Saving…' : 'Save changes'}
            onClick={() => void onSave()}
          />
        </div>
      </main>
    </div>
  );
};
