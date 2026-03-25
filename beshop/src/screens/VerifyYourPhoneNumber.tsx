import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {isSupabaseConfigured} from '../supabaseClient';
import {
  sendPhoneVerificationCode,
  toE164Strict,
} from '../utils/phoneVerification';

import background from '../assets/bg/07.png';
import { APP_PALETTE } from '../theme/appPalette';

const PHONE_STORAGE = 'candle_verify_phone';

export const VerifyYourPhoneNumber: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  const handleConfirm = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured for this build. In the beshop folder, create .env.local with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (Dashboard → Settings → API), save, stop npm start, and run it again.',
      );
      return;
    }
    const normalized = toE164Strict(phone);
    if (!normalized) {
      setError('Enter a valid number with country code (e.g. +17041234567).');
      return;
    }
    setLoading(true);
    const result = await sendPhoneVerificationCode(normalized);
    setLoading(false);
    if (!result.ok) {
      const map: Record<string, string> = {
        twilio_not_configured:
          'Twilio is not configured in Supabase (function secrets).',
        invalid_phone_format:
          'Invalid phone format. Use +1 and the full number.',
        invalid_json: 'Invalid request. Reload the page and try again.',
        empty_body: 'Empty request. Reload the page and try again.',
        database_error:
          'Could not save the code. Did you run the phone_verifications SQL in Supabase?',
        sms_send_failed:
          'Twilio rejected the SMS. Check the number in Twilio and your account balance.',
        supabase_not_configured:
          'Supabase is missing from the environment. Check beshop/.env.local and restart npm start.',
      };
      setError(map[result.error ?? ''] ?? result.error ?? 'Could not send SMS. Try again.');
      return;
    }
    try {
      sessionStorage.setItem(PHONE_STORAGE, normalized);
    } catch {
      /* ignore */
    }
    navigate(Routes.ConfirmationCode, {state: {phone: normalized}});
  };

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Verify Number'
        headerStyle={{backgroundColor: 'var(--white-color)'}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main className='scrollable'>
        <div
          style={{
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 16,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            paddingBottom: 30,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 30,
          }}
        >
          <p
            className='t16'
            style={{marginBottom: 30}}
          >
            We&apos;ll send a verification code by SMS to the number you enter
            below (include country code, e.g. +1).
          </p>
          <custom.InputField
            placeholder='+17041234567'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            inputMode='tel'
            autoComplete='tel'
            maxLength={18}
            containerStyle={{
              marginBottom: 12,
            }}
          />
          {error && (
            <p
              className='t16'
              style={{marginBottom: 16, color: '#b00020'}}
            >
              {error}
            </p>
          )}
          <components.Button
            text={loading ? 'Sending...' : 'confirm'}
            onClick={() => void handleConfirm()}
            containerStyle={{marginBottom: 8, opacity: loading ? 0.85 : 1}}
          />
        </div>
      </main>
    );
  };

  return (
    <>
      {renderHeader()}
      {renderContent()}
    </>
  );
};
