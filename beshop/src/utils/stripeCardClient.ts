import {supabase} from '../supabaseClient';

type ConfigPayload = {ok?: boolean; publishableKey?: string; error?: string; mode?: string};
type SavePayload = {
  ok?: boolean;
  error?: string;
  payment_method?: {id: string; brand: string; last4: string; exp_month: number; exp_year: number};
};
type ListPayload = {
  ok?: boolean;
  error?: string;
  cards?: Array<{
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    holder_name?: string;
  }>;
};

export async function readFnError(error: unknown): Promise<string> {
  let msg = error instanceof Error ? error.message : 'invoke_failed';
  try {
    const ctx = (error as {context?: Response}).context;
    if (ctx && typeof ctx.json === 'function') {
      const j = (await ctx.clone().json()) as {error?: string};
      if (typeof j.error === 'string') {
        msg = j.error;
      }
    }
  } catch {
    /* ignore */
  }
  return msg;
}

export async function fetchStripePublishableKey(): Promise<{
  ok: true;
  publishableKey: string;
  mode: string;
} | {ok: false; error: string}> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-payment-config', {
    body: {},
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as ConfigPayload | null;
  if (p?.ok === true && typeof p.publishableKey === 'string' && p.publishableKey.startsWith('pk_')) {
    return {ok: true, publishableKey: p.publishableKey, mode: p.mode ?? ''};
  }
  return {ok: false, error: p?.error ?? 'stripe_config_unavailable'};
}

export async function saveStripePaymentMethod(
  paymentMethodId: string,
): Promise<{ok: true} | {ok: false; error: string}> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-save-card', {
    body: {payment_method_id: paymentMethodId},
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as SavePayload | null;
  if (p?.ok === true) {
    return {ok: true};
  }
  return {ok: false, error: p?.error ?? 'save_failed'};
}

export async function listStripeSavedCards(): Promise<
  {ok: true; cards: ListPayload['cards']} | {ok: false; error: string}
> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-list-cards', {
    body: {},
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as ListPayload | null;
  if (p?.ok === true) {
    return {ok: true, cards: p.cards ?? []};
  }
  return {ok: false, error: p?.error ?? 'list_failed'};
}

export async function deleteStripeSavedCard(
  paymentMethodId: string,
): Promise<{ok: true} | {ok: false; error: string}> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-delete-card', {
    body: {payment_method_id: paymentMethodId},
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as {ok?: boolean; error?: string} | null;
  if (p?.ok === true) {
    return {ok: true};
  }
  return {ok: false, error: p?.error ?? 'delete_failed'};
}

export async function chargeSavedCard(params: {
  paymentMethodId: string;
  amountCents: number;
  currency?: string;
  orderRef?: string;
}): Promise<
  {ok: true; paymentIntentId: string; chargeId: string} | {ok: false; error: string}
> {
  if (!supabase) {
    return {ok: false, error: 'supabase_not_configured'};
  }
  const {data, error} = await supabase.functions.invoke('stripe-charge-saved-card', {
    body: {
      payment_method_id: params.paymentMethodId,
      amount_cents: params.amountCents,
      currency: params.currency ?? 'usd',
      order_ref: params.orderRef ?? '',
    },
  });
  if (error) {
    return {ok: false, error: await readFnError(error)};
  }
  const p = data as {
    ok?: boolean;
    error?: string;
    payment_intent_id?: string;
    charge_id?: string;
  } | null;
  if (p?.ok === true) {
    return {
      ok: true,
      paymentIntentId: String(p.payment_intent_id ?? ''),
      chargeId: typeof p.charge_id === 'string' ? p.charge_id : '',
    };
  }
  return {ok: false, error: p?.error ?? 'charge_failed'};
}
