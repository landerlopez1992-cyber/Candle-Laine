import React, {useEffect} from 'react';

import {hooks} from '../hooks';
import {actions} from '../store/actions';
import {components} from '../components';
import {APP_PALETTE} from '../theme/appPalette';

const pStyle: React.CSSProperties = {
  color: APP_PALETTE.textOnDark,
  lineHeight: 1.65,
  fontSize: 14,
  marginBottom: 14,
};

const hStyle: React.CSSProperties = {
  color: APP_PALETTE.textOnDark,
  fontSize: 16,
  fontWeight: 700,
  marginTop: 20,
  marginBottom: 10,
};

/**
 * Texto legal genérico (placeholder). Sustituye por el que te indique tu asesor legal.
 */
export const TermsAndConditions: React.FC = () => {
  hooks.useThemeColor(APP_PALETTE.appShell);
  const dispatch = hooks.useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(actions.setColor(APP_PALETTE.appShell));
  }, [dispatch]);

  return (
    <>
      <components.Header
        title='Terms & Conditions'
        showGoBack={true}
        headerStyle={{backgroundColor: APP_PALETTE.headerBand}}
      />
      <main
        className='scrollable'
        style={{
          backgroundColor: 'var(--main-background)',
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <p style={pStyle}>
          Welcome to Candle-Laine. By accessing our website, mobile application, or
          purchasing our products, you agree to these Terms & Conditions. If you do
          not agree, please do not use our services.
        </p>

        <h2 style={hStyle}>1. Company information</h2>
        <p style={pStyle}>
          Candle-Laine is an American brand offering handmade candles, fragrance
          sprays, and artisan soaps. Product descriptions, imagery, and availability
          are provided for informational purposes and may change without notice.
        </p>

        <h2 style={hStyle}>2. Orders & pricing</h2>
        <p style={pStyle}>
          When you place an order, you offer to purchase products at the prices and
          terms shown at checkout. We may refuse or cancel an order in cases such as
          suspected fraud, inventory limits, or errors in listing. Taxes and shipping,
          if applicable, are shown before you confirm payment.
        </p>

        <h2 style={hStyle}>3. Handmade products & variations</h2>
        <p style={pStyle}>
          Our goods are handmade in small batches. Minor variations in color, scent,
          weight, or appearance are normal and are not considered defects unless they
          materially affect use or safety.
        </p>

        <h2 style={hStyle}>4. Shipping & risk of loss</h2>
        <p style={pStyle}>
          Delivery timelines are estimates. Risk of loss passes according to the
          carrier&apos;s terms once the package is handed to the courier. Please
          inspect your order on arrival and contact us promptly if something arrives
          damaged or incorrect.
        </p>

        <h2 style={hStyle}>5. Returns & exchanges</h2>
        <p style={pStyle}>
          Return and exchange rules depend on product type and timing. Unless a
          different policy is stated at purchase, contact us through the channels
          listed in your order confirmation. Certain items may be non-returnable for
          hygiene or safety reasons.
        </p>

        <h2 style={hStyle}>6. Limitation of liability</h2>
        <p style={pStyle}>
          To the fullest extent permitted by law, Candle-Laine is not liable for
          indirect, incidental, or consequential damages arising from use of our
          products or site. Our total liability for any claim related to an order is
          limited to the amount you paid for that order.
        </p>

        <h2 style={hStyle}>7. Intellectual property</h2>
        <p style={pStyle}>
          All content on this site—including text, graphics, logos, and
          photography—is owned by Candle-Laine or its licensors. You may not copy,
          modify, or distribute it without written permission.
        </p>

        <h2 style={hStyle}>8. Changes</h2>
        <p style={pStyle}>
          We may update these terms from time to time. The revised version will apply
          when posted, except where prohibited by law. Continued use of our services
          after changes means you accept the updated terms.
        </p>

        <h2 style={hStyle}>9. Contact</h2>
        <p style={{...pStyle, marginBottom: 0}}>
          For questions about these Terms & Conditions, please reach out through the
          contact options provided in the app or on your order communications.
        </p>
      </main>
    </>
  );
};
