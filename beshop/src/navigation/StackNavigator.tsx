import React from 'react';
import {Outlet, RouterProvider, createBrowserRouter} from 'react-router-dom';

import {Routes} from '../enums';
import {screens} from '../screens';
import {BlockedAccountGuard} from './BlockedAccountGuard';
import {TabNavigator} from './TabNavigator';

const RootLayout: React.FC = () => (
  <>
    <BlockedAccountGuard />
    <Outlet />
  </>
);

/**
 * GitHub Pages sirve la build en /Candle-Laine/ (homepage en package.json → PUBLIC_URL).
 * En desarrollo, CRA suele inyectar el mismo PUBLIC_URL y el usuario abre localhost:3000/,
 * lo que rompe el match del Router; el basename solo aplica en producción.
 */
const routerBasename =
  process.env.NODE_ENV === 'production' &&
  typeof process.env.PUBLIC_URL === 'string' &&
  process.env.PUBLIC_URL !== '/' &&
  process.env.PUBLIC_URL.length > 0
    ? process.env.PUBLIC_URL.replace(/\/$/, '')
    : '';

const stack = createBrowserRouter(
  [
  {
    element: <RootLayout />,
    children: [
  {
    path: Routes.TabNavigator,
    element: <TabNavigator />,
  },
  {
    path: Routes.SignIn,
    element: <screens.SignIn />,
  },
  {
    path: Routes.OrderHistory,
    element: <screens.OrderHistory />,
  },
  {
    path: Routes.OrderFailed,
    element: <screens.OrderFailed />,
  },
  {
    path: Routes.MyAddress,
    element: <screens.MyAddress />,
  },
  {
    path: Routes.FAQ,
    element: <screens.FAQ />,
  },
  {
    path: Routes.TermsAndConditions,
    element: <screens.TermsAndConditions />,
  },
  {
    path: Routes.BrandStory,
    element: <screens.BrandStory />,
  },
  {
    path: Routes.AdminCategoryDetail,
    element: <screens.AdminCategoryDetail />,
  },
  {
    path: Routes.Admin,
    element: <screens.Admin />,
  },
  {
    path: Routes.OrderHistoryEmpty,
    element: <screens.OrderHistoryEmpty />,
  },
  {
    path: Routes.CheckoutPaymentMethod,
    element: <screens.CheckoutPaymentMethod />,
  },
  {
    path: Routes.CheckoutInstallmentsPick,
    element: <screens.CheckoutInstallmentsPick />,
  },
  {
    path: Routes.CheckoutPaymentDetail,
    element: <screens.CheckoutPaymentDetail />,
  },
  {
    path: Routes.CheckoutBnplReturn,
    element: <screens.CheckoutBnplReturn />,
  },
  {
    path: Routes.TrackYourOrder,
    element: <screens.TrackYourOrder />,
  },
  {
    path: Routes.ShippingAPaymentInfo,
    element: <screens.ShippingAPaymentInfo />,
  },
  {
    path: Routes.EditProfile,
    element: <screens.EditProfile />,
  },
  {
    path: Routes.ConfirmationCode,
    element: <screens.ConfirmationCode />,
  },
  {
    path: Routes.VerifyYourEmail,
    element: <screens.VerifyYourEmail />,
  },
  {
    path: Routes.AuthCallback,
    element: <screens.AuthCallback />,
  },
  {
    path: Routes.MyPromocodes,
    element: <screens.MyPromocodes />,
  },
  {
    path: Routes.NewPassword,
    element: <screens.NewPassword />,
  },
  {
    path: Routes.SignUp,
    element: <screens.SignUp />,
  },
  {
    path: Routes.SignUpAccountCreated,
    element: <screens.SignUpAccountCreated />,
  },
  {
    path: Routes.ForgotPassword,
    element: <screens.ForgotPassword />,
  },
  {
    path: Routes.OrderSuccessful,
    element: <screens.OrderSuccessful />,
  },
  {
    path: Routes.Checkout,
    element: <screens.Checkout />,
  },
  {
    path: Routes.ForgotPasswordSentEmail,
    element: <screens.ForgotPasswordSentEmail />,
  },
  {
    path: Routes.Shop,
    element: <screens.Shop />,
  },
  {
    path: Routes.Reviews,
    element: <screens.Reviews />,
  },
  {
    path: Routes.PaymentMethod,
    element: <screens.PaymentMethod />,
  },
  {
    path: Routes.Description,
    element: <screens.Description />,
  },
  {
    path: Routes.AddANewCard,
    element: <screens.AddANewCard />,
  },
  {
    path: Routes.LeaveAReviews,
    element: <screens.LeaveAReviews />,
  },
  {
    path: Routes.AddANewAddress,
    element: <screens.AddANewAddress />,
  },
  {
    path: Routes.CheckoutShippingDetails,
    element: <screens.CheckoutShippingDetails />,
  },
  {
    path: Routes.CheckoutShippingMethod,
    element: <screens.CheckoutShippingMethod />,
  },
  {
    path: Routes.VerifyYourPhoneNumber,
    element: <screens.VerifyYourPhoneNumber />,
  },
  {
    path: Routes.Product,
    element: <screens.Product />,
  },
  {
    path: Routes.LeaveAReviews,
    element: <screens.LeaveAReviews />,
  },
  {
    path: Routes.MyPromocodesEmpty,
    element: <screens.MyPromocodesEmpty />,
  },
  {
    path: Routes.AccountBlocked,
    element: <screens.AccountBlocked />,
  },
    ],
  },
  ],
  routerBasename ? { basename: routerBasename } : {},
);

export const StackNavigator: React.FC = () => {
  return <RouterProvider router={stack} />;
};
