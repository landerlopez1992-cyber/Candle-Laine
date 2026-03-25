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
        'Supabase no está configurado en esta compilación. En la carpeta beshop crea .env.local con REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY (Dashboard → Settings → API), guarda, detén npm start y vuelve a ejecutarlo.',
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
          'Twilio no está configurado en Supabase (secrets de la función).',
        invalid_phone_format:
          'Formato de teléfono no válido. Usa +1 y el número completo.',
        invalid_json: 'Petición inválida. Recarga la página e inténtalo de nuevo.',
        empty_body: 'Petición vacía. Recarga la página e inténtalo de nuevo.',
        database_error:
          'Error al guardar el código. ¿Ejecutaste el SQL de phone_verifications en Supabase?',
        sms_send_failed:
          'Twilio rechazó el SMS. Revisa el número en Twilio y el saldo de la cuenta.',
        supabase_not_configured:
          'Supabase no está en las variables de entorno. Revisa beshop/.env.local y reinicia npm start.',
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
