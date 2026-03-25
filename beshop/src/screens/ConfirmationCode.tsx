import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {
  sendPhoneVerificationCode,
  verifyPhoneCode,
} from '../utils/phoneVerification';

import background from '../assets/bg/07.png';
import { APP_PALETTE } from '../theme/appPalette';

const PHONE_STORAGE = 'candle_verify_phone';
const OTP_LEN = 5;

export const ConfirmationCode: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = useMemo(() => {
    const fromLoc = (location.state as {phone?: string} | null)?.phone;
    if (fromLoc) {
      return fromLoc;
    }
    try {
      return sessionStorage.getItem(PHONE_STORAGE) ?? '';
    } catch {
      return '';
    }
  }, [location.state]);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    if (!phone) {
      navigate(Routes.VerifyYourPhoneNumber, {replace: true});
    }
  }, [phone, navigate]);

  const digits = useMemo(() => {
    const padded = otp.padEnd(OTP_LEN, ' ');
    return padded.slice(0, OTP_LEN).split('');
  }, [otp]);

  const setDigitAt = (index: number, char: string) => {
    const d = char.replace(/\D/g, '').slice(-1);
    const arr = otp.split('');
    while (arr.length < OTP_LEN) {
      arr.push('');
    }
    arr[index] = d;
    const next = arr.join('').slice(0, OTP_LEN);
    setOtp(next);
    if (d && index < OTP_LEN - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    setOtp(t);
    const focusIdx = Math.min(t.length, OTP_LEN - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleConfirm = async () => {
    if (!phone || otp.length !== OTP_LEN) {
      setError('Enter the full code.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await verifyPhoneCode(phone, otp);
    setLoading(false);
    if (!result.ok) {
      const map: Record<string, string> = {
        invalid_code: 'Wrong code.',
        expired: 'Code expired. Request a new one.',
        invalid_or_expired: 'Invalid or expired code.',
      };
      setError(map[result.error ?? ''] ?? 'Verification failed.');
      return;
    }
    try {
      sessionStorage.removeItem(PHONE_STORAGE);
    } catch {
      /* ignore */
    }
    navigate(Routes.SignUpAccountCreated);
  };

  const handleResend = async () => {
    if (!phone) {
      return;
    }
    setError(null);
    setResendBusy(true);
    const result = await sendPhoneVerificationCode(phone);
    setResendBusy(false);
    if (!result.ok) {
      setError('Could not resend. Try again.');
      return;
    }
    setOtp('');
    inputsRef.current[0]?.focus();
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
    const displayPhone = phone || '—';
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
            We sent an SMS with a code to {displayPhone}. Enter your OTP below.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 30,
            }}
            onPaste={handlePaste}
          >
            {digits.map((ch, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  width: '17%',
                  aspectRatio: 1 / 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '1px solid var(--main-color)',
                  backgroundColor: 'var(--white-color)',
                }}
              >
                <input
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  maxLength={1}
                  value={ch.trim() === '' ? '' : ch}
                  onChange={(e) => setDigitAt(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Backspace') {
                      return;
                    }
                    if (otp.charAt(index)) {
                      e.preventDefault();
                      const next =
                        otp.slice(0, index) + otp.slice(index + 1);
                      setOtp(next);
                    } else if (index > 0) {
                      inputsRef.current[index - 1]?.focus();
                    }
                  }}
                  style={{
                    textAlign: 'center',
                    width: '100%',
                    height: '100%',
                    fontFamily: 'League Spartan',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 20,
                  }}
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  autoComplete='one-time-code'
                  disabled={loading}
                />
              </div>
            ))}
          </div>
          <span
            className='row-center t16'
            style={{marginBottom: 30}}
          >
            Didn&apos;t receive the OTP?{' '}
            <button
              type='button'
              disabled={resendBusy || loading}
              onClick={() => void handleResend()}
              style={{
                marginLeft: 4,
                color: 'var(--accent-color)',
                background: 'none',
                border: 'none',
                cursor: resendBusy || loading ? 'default' : 'pointer',
                padding: 0,
                font: 'inherit',
              }}
            >
              {resendBusy ? 'Sending…' : 'Resend.'}
            </button>{' '}
          </span>
          {error && (
            <p
              className='t16'
              style={{marginBottom: 16, color: '#b00020'}}
            >
              {error}
            </p>
          )}
          <components.Button
            text={loading ? 'Verifying...' : 'confirm'}
            onClick={() => void handleConfirm()}
            containerStyle={{opacity: loading ? 0.85 : 1}}
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
