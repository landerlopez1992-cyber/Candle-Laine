import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {loadStripe, type Stripe} from '@stripe/stripe-js';

import {hooks} from '../hooks';
import {custom} from '../custom';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';
import {Routes} from '../enums';
import {supabase} from '../supabaseClient';
import {
  fetchStripePublishableKey,
  saveStripePaymentMethod,
} from '../utils/stripeCardClient';

const inputWrap: React.CSSProperties = {
  marginBottom: 10,
  borderRadius: 8,
  backgroundColor: APP_PALETTE.inputSurface,
  border: `1px solid ${APP_PALETTE.border}`,
};

const stripeElementWrap: React.CSSProperties = {
  ...inputWrap,
  backgroundColor: APP_PALETTE.cartCardSurface,
  padding: '18px 20px',
  minHeight: 60,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
};

const stripeBaseStyle = {
  fontSize: '18px',
  lineHeight: '24px',
  color: '#1C2D18',
  fontFamily: 'Lato, sans-serif',
  '::placeholder': {
    color: '#7C6E61',
  },
};

const stripeElementOptions = {
  style: {
    base: stripeBaseStyle,
    invalid: {
      color: '#a33',
    },
  },
};

const stripeNumberOptions = {
  ...stripeElementOptions,
  placeholder: '1234 1234 1234 1234',
};

const stripeExpiryOptions = {
  ...stripeElementOptions,
  placeholder: 'MM/YY',
};

const stripeCvcOptions = {
  ...stripeElementOptions,
  placeholder: 'CVV',
};

type InnerProps = {
  onSuccess: () => void;
};

const AddCardStripeForm: React.FC<InnerProps> = ({onSuccess}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    setErr(null);
    if (!stripe || !elements) {
      setErr('Stripe aún no está listo. Espera un momento.');
      return;
    }
    const numEl = elements.getElement(CardNumberElement);
    if (!numEl) {
      setErr('No se pudo leer los datos de la tarjeta.');
      return;
    }
    if (!name.trim()) {
      setErr('Escribe el nombre que figura en la tarjeta.');
      return;
    }
    setBusy(true);
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: numEl,
      billing_details: {name: name.trim()},
    });
    if (error || !paymentMethod) {
      setErr(error?.message ?? 'No se pudo validar la tarjeta.');
      setBusy(false);
      return;
    }
    const saved = await saveStripePaymentMethod(paymentMethod.id);
    setBusy(false);
    if (!saved.ok) {
      setErr(
        saved.error === 'unauthorized'
          ? 'Tu sesión caducó. Vuelve a iniciar sesión.'
          : saved.error === 'profile_lookup_failed' ||
              saved.error === 'profile_create_failed' ||
              saved.error === 'profile_not_ready'
            ? 'No se pudo preparar tu perfil de pago. Inténtalo de nuevo en unos segundos.'
          : saved.error,
      );
      return;
    }
    onSuccess();
  };

  return (
    <>
      <custom.InputField
        containerStyle={inputWrap}
        placeholder='Full name on card'
        autoComplete='cc-name'
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
      />
      <label
        className='t12'
        style={{display: 'block', marginBottom: 6, color: APP_PALETTE.textMuted}}
      >
        Card number
      </label>
      <div style={stripeElementWrap}>
        <div style={{width: '100%'}}>
          <CardNumberElement options={stripeNumberOptions} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 11,
        }}
      >
        <div style={{flex: 1, minWidth: 0}}>
          <label
            className='t12'
            style={{display: 'block', marginBottom: 6, color: APP_PALETTE.textMuted}}
          >
            MM/YY
          </label>
          <div style={{...stripeElementWrap, marginBottom: 0}}>
            <div style={{width: '100%'}}>
              <CardExpiryElement options={stripeExpiryOptions} />
            </div>
          </div>
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <label
            className='t12'
            style={{display: 'block', marginBottom: 6, color: APP_PALETTE.textMuted}}
          >
            CVV
          </label>
          <div style={{...stripeElementWrap, marginBottom: 0}}>
            <div style={{width: '100%'}}>
              <CardCvcElement options={stripeCvcOptions} />
            </div>
          </div>
        </div>
      </div>
      {err ? (
        <p className='t14' style={{color: APP_PALETTE.accent, marginBottom: 12}}>
          {err}
        </p>
      ) : null}
      <p className='t12' style={{color: APP_PALETTE.textMuted, marginBottom: 14, lineHeight: 1.45}}>
        Los datos de la tarjeta se envían de forma segura a Stripe (campos protegidos); no pasan por
        nuestros servidores.
      </p>
      <components.Button
        text={busy ? 'Guardando…' : 'save card'}
        onClick={() => void handleSave()}
      />
    </>
  );
};

export const AddANewCard: React.FC = () => {
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();
  const dispatch = hooks.useDispatch();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [configErr, setConfigErr] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!supabase) {
        if (!cancelled) {
          setConfigErr('Supabase no está configurado.');
        }
        return;
      }
      const {data: sess} = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      setHasSession(Boolean(sess.session));
      setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cfg = await fetchStripePublishableKey();
      if (cancelled) {
        return;
      }
      if (!cfg.ok) {
        setConfigErr(
          cfg.error === 'publishable_key_test_missing' ||
            cfg.error === 'publishable_key_live_missing'
            ? 'Falta la Publishable Key en Admin → Stripe (pk_test_ o pk_live_).'
            : cfg.error,
        );
        return;
      }
      setStripePromise(loadStripe(cfg.publishableKey));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = useCallback(() => {
    const ret = (location.state as {returnTo?: string} | null)?.returnTo;
    if (typeof ret === 'string' && ret.startsWith('/')) {
      navigate(ret, {replace: true});
      return;
    }
    navigate(-1);
  }, [navigate, location.state]);

  const elementsOptions = useMemo(() => ({}), []);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        showGoBack={true}
        title='Add A New Card'
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const renderContent = (): JSX.Element => {
    return (
      <main
        className='scrollable'
        style={{
          backgroundColor: APP_PALETTE.appShell,
          paddingTop: 16,
          paddingBottom: 28,
          minHeight: 'calc(100vh - 120px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginLeft: 20,
            marginRight: 20,
            paddingBottom: 8,
          }}
        >
          {/** Vista previa de tarjeta (demo): no alterar imagen ni proporciones. */}
          <img
            src='https://george-fx.github.io/beshop_api/assets/cards/01.png'
            alt='card'
            style={{
              width: '90%',
              height: 'auto',
              margin: '0 auto',
              marginBottom: 30,
              display: 'block',
            }}
          />

          {!sessionReady ? (
            <p className='t16' style={{color: APP_PALETTE.textMuted}}>
              Cargando…
            </p>
          ) : !hasSession ? (
            <>
              <p className='t15' style={{color: APP_PALETTE.textMuted, marginBottom: 16}}>
                Inicia sesión para guardar una tarjeta en tu cuenta.
              </p>
              <components.Button text='Ir a iniciar sesión' onClick={() => navigate(Routes.SignIn)} />
            </>
          ) : configErr ? (
            <p className='t15' style={{color: '#a33', marginBottom: 12}}>
              {configErr}
            </p>
          ) : !stripePromise ? (
            <p className='t16' style={{color: APP_PALETTE.textMuted}}>
              Cargando Stripe…
            </p>
          ) : (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <AddCardStripeForm onSuccess={onSuccess} />
            </Elements>
          )}
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
