import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';

import {hooks} from '../hooks';
import {Routes} from '../enums';
import {actions} from '../store/actions';
import {components} from '../components';
import {svg} from '../assets/svg';
import {supabase} from '../supabaseClient';
import {isAdminEmail} from '../utils/adminAccess';
import {AdminOrdersPanel} from './admin/AdminOrdersPanel';
import {AdminProductsPanel} from './admin/AdminProductsPanel';
import {AdminUsersPanel} from './admin/AdminUsersPanel';
import {AdminSettingsPanel} from './admin/AdminSettingsPanel';
import {AdminPromotionsPanel} from './admin/AdminPromotionsPanel';
import {AdminOffersPanel} from './admin/AdminOffersPanel';
import {ADMIN_SECTIONS, AdminShell, type AdminSection} from './admin/AdminShell';
import { APP_PALETTE } from '../theme/appPalette';

/** Viewports narrower than this only see the “use a larger screen” message (phones, small handsets). */
const ADMIN_MIN_VIEWPORT_PX = 1024;

function useViewportAtLeast(minWidthPx: number): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${minWidthPx}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidthPx}px)`);
    const onChange = () => setMatches(mq.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [minWidthPx]);

  return matches;
}

/**
 * Admin area (only for emails in adminAccess). Non-admins are redirected away.
 * UI is only shown on wide viewports; narrow screens get a blocking message.
 */
type AdminLocationState = {adminSection?: AdminSection};

export const Admin: React.FC = () => {
  const dispatch = hooks.useDispatch();
  const navigate = hooks.useNavigate();
  const location = hooks.useLocation();
  const [searchParams] = useSearchParams();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [section, setSection] = useState<AdminSection>(() => {
    const s = (location.state as AdminLocationState | null)?.adminSection;
    if (
      s === 'users' ||
      s === 'orders' ||
      s === 'products' ||
      s === 'offers' ||
      s === 'promotions' ||
      s === 'settings'
    ) {
      return s;
    }
    return 'users';
  });
  const viewportLargeEnough = useViewportAtLeast(ADMIN_MIN_VIEWPORT_PX);

  hooks.useThemeColor(APP_PALETTE.appShell);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  /** Stripe Connect devuelve ?code=&state= en /admin tras autorizar. */
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      setSection('settings');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!supabase) {
      navigate(Routes.SignIn, {replace: true});
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({data: {session}}) => {
      if (cancelled) {
        return;
      }
      const email = session?.user?.email;
      if (email && isAdminEmail(email)) {
        setAllowed(true);
      } else {
        navigate(Routes.TabNavigator, {replace: true});
      }
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate(Routes.TabNavigator, {replace: true});
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (allowed !== true || !viewportLargeEnough) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [allowed, viewportLargeEnough]);

  const renderHeader = (): JSX.Element => {
    return (
      <components.Header
        title='Admin'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
    );
  };

  const activeMeta = ADMIN_SECTIONS.find((s) => s.id === section) ?? ADMIN_SECTIONS[0];

  const renderAdminShell = (): JSX.Element => {
    return (
      <AdminShell activeSection={section} onNavigateSection={setSection}>
        <div style={{width: '100%', maxWidth: '100%'}}>
          {section === 'users' && <AdminUsersPanel />}
          {section === 'orders' && <AdminOrdersPanel />}
          {section === 'products' && <AdminProductsPanel />}
          {section === 'offers' && <AdminOffersPanel />}
          {section === 'settings' && <AdminSettingsPanel />}
          {section === 'promotions' && <AdminPromotionsPanel />}
          {section !== 'users' &&
            section !== 'orders' &&
            section !== 'products' &&
            section !== 'offers' &&
            section !== 'promotions' &&
            section !== 'settings' && (
            <>
              <h1
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontFamily: 'League Spartan, sans-serif',
                  fontSize: 28,
                  fontWeight: 600,
                  color: APP_PALETTE.textOnDark,
                }}
              >
                {activeMeta.label}
              </h1>
              <p
                className='t18'
                style={{
                  margin: 0,
                  marginBottom: 32,
                  lineHeight: 1.55,
                  color: APP_PALETTE.textMuted,
                }}
              >
                {activeMeta.description}
              </p>
              <div
                style={{
                  minHeight: 220,
                  width: '100%',
                  borderRadius: 12,
                  border: `1px dashed ${APP_PALETTE.border}`,
                  backgroundColor: APP_PALETTE.imageWell,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 32,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <p
                  className='t16'
                  style={{
                    margin: 0,
                    maxWidth: 560,
                    lineHeight: 1.6,
                    color: APP_PALETTE.priceMuted,
                  }}
                >
                  Contenido de «{activeMeta.label}» — próximamente.
                </p>
              </div>
            </>
          )}
        </div>
      </AdminShell>
    );
  };

  if (allowed !== true) {
    return (
      <>
        {renderHeader()}
        <main
          className='scrollable'
          style={{
            backgroundColor: 'var(--white-color)',
            minHeight: '40vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <components.Loader />
        </main>
      </>
    );
  }

  if (!viewportLargeEnough) {
    return (
      <>
        {renderHeader()}
        <main
          className='scrollable'
          style={{
            backgroundColor: APP_PALETTE.headerBand,
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px 48px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              border: '4px solid var(--accent-color)',
              backgroundColor: 'var(--white-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <svg.BriefcaseSvg />
          </div>
          <h2
            style={{
              marginBottom: 16,
              textTransform: 'capitalize',
              lineHeight: 1.3,
            }}
          >
            Use a larger screen
          </h2>
          <p
            className='t18'
            style={{
              marginBottom: 12,
              lineHeight: 1.55,
              maxWidth: 420,
            }}
          >
            The admin panel needs more space to work correctly. Open this page
            on a computer, laptop, or a large tablet (or rotate your device to
            landscape if the screen is wide enough).
          </p>
          <p
            className='t16'
            style={{
              color: 'var(--main-color)',
              opacity: 0.75,
              maxWidth: 400,
              lineHeight: 1.5,
            }}
          >
            Minimum width: {ADMIN_MIN_VIEWPORT_PX}px — narrow phone layouts are
            not supported here.
          </p>
        </main>
      </>
    );
  }

  return renderAdminShell();
};
