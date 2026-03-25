import type {Stripe} from '@stripe/stripe-js';

import {supabase} from '../supabaseClient';

import {readFnError} from './stripeCardClient';

export type BnplProvider = 'klarna' | 'affirm';

type StripeWithBnpl = Stripe & {
  confirmKlarnaPayment?: (
    clientSecret: string,
    data?: Record<string, unknown>,
  ) => Promise<{error?: {message?: string}}>;
  confirmAffirmPayment?: (
    clientSecret: string,
    data?: Record<string, unknown>,
  ) => Promise<{error?: {message?: string}}>;
};

export async function createBnplPaymentIntent(params: {
  provider: BnplProvider;
  amountCents: number;
  currency?: string;
  orderRef: string;
  shippingAddressId: string;
}): Promise<
  {ok: true; clientSecret: string; paymentIntentId: string} | {ok: false; error: string}
> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-bnpl-intent', {
    body: {
      provider: params.provider,
      amount_cents: params.amountCents,
      currency: params.currency ?? 'usd',
      order_ref: params.orderRef,
      shipping_address_id: params.shippingAddressId,
    },
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as {
    ok?: boolean;
    error?: string;
    client_secret?: string;
    payment_intent_id?: string;
  } | null;
  if (p?.ok === true && typeof p.client_secret === 'string') {
    return {
      ok: true,
      clientSecret: p.client_secret,
      paymentIntentId: String(p.payment_intent_id ?? ''),
    };
  }
  return {ok: false, error: p?.error ?? 'bnpl_intent_failed'};
}

export async function confirmBnplRedirect(params: {
  stripe: Stripe;
  clientSecret: string;
  provider: BnplProvider;
  returnUrl: string;
  billingDetails: {
    email: string;
    name: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  shipping: {
    name: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}): Promise<{ok: true} | {ok: false; error: string}> {
  const stripe = params.stripe as StripeWithBnpl;

  if (params.provider === 'klarna') {
    const fn = stripe.confirmKlarnaPayment;
    if (typeof fn !== 'function') {
      return {ok: false, error: 'stripe_klarna_not_available'};
    }
    const {error} = await fn(params.clientSecret, {
      payment_method: {
        billing_details: {
          email: params.billingDetails.email,
          name: params.billingDetails.name,
          address: params.billingDetails.address,
        },
      },
      return_url: params.returnUrl,
    });
    if (error?.message) {
      return {ok: false, error: error.message};
    }
    return {ok: true};
  }

  const fn = stripe.confirmAffirmPayment;
  if (typeof fn !== 'function') {
    return {ok: false, error: 'stripe_affirm_not_available'};
  }
  const {error} = await fn(params.clientSecret, {
    payment_method: {
      billing_details: {
        email: params.billingDetails.email,
        name: params.billingDetails.name,
        address: params.billingDetails.address,
      },
    },
    shipping: params.shipping,
    return_url: params.returnUrl,
  });
  if (error?.message) {
    return {ok: false, error: error.message};
  }
  return {ok: true};
}
