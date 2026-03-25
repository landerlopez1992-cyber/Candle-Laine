import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type CheckoutPaymentKind = 'zelle' | 'installments' | 'card';

/** BNPL vía Stripe (activar Klarna/Affirm en el Dashboard). */
export type InstallmentsProvider = 'affirm' | 'klarna';

export type CheckoutPaymentSelection = {
  kind: CheckoutPaymentKind;
  cardId?: string;
  cardLabel?: string;
  installmentsProvider?: InstallmentsProvider;
};

/** Opción de envío (USPS u estimación); `amount_cents` para total coherente con el cobro. */
export type CheckoutShippingOption = {
  id: string;
  label: string;
  amount_cents: number;
  /** Presente cuando `shipping-quote` lo envía (UI: logo USPS/UPS). */
  carrier?: 'usps' | 'ups' | 'estimate';
};

export interface PaymentState {
  cvv: string;
  name: string;
  /** Línea única de la dirección de envío elegida en checkout (Supabase `user_addresses`). */
  address: string;
  /** `user_addresses.id` seleccionado; null si aún no hay elección. */
  checkoutShippingAddressId: string | null;
  cardNumber: string;
  expiryDate: string;
  cardHolderName: string;
  /** Método confirmado en checkout (detalle → Aceptar). */
  checkoutPaymentSelection: CheckoutPaymentSelection | null;
  /**
   * Cotización de envío (USD) desde `shipping-quote` cuando hay dirección.
   * null = sin cotizar o dirección cambiada.
   */
  checkoutShippingUsd: number | null;
  /** Filas devueltas por la API (varias clases USPS o una estimación). */
  checkoutShippingOptions: CheckoutShippingOption[] | null;
  /** Id de la opción elegida (debe coincidir con `checkoutShippingOptions`). */
  checkoutShippingOptionId: string | null;
}

const initialState: PaymentState = {
  cvv: '',
  name: '',
  address: '',
  checkoutShippingAddressId: null,
  expiryDate: '',
  cardNumber: '',
  cardHolderName: '',
  checkoutPaymentSelection: null,
  checkoutShippingUsd: null,
  checkoutShippingOptions: null,
  checkoutShippingOptionId: null,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
    },
    setCheckoutShippingSelection: (
      state,
      action: PayloadAction<
        {addressId: string; formattedLine: string} | null
      >,
    ) => {
      if (action.payload === null) {
        state.checkoutShippingAddressId = null;
        state.address = '';
      } else {
        state.checkoutShippingAddressId = action.payload.addressId;
        state.address = action.payload.formattedLine;
      }
      state.checkoutShippingUsd = null;
      state.checkoutShippingOptions = null;
      state.checkoutShippingOptionId = null;
    },
    setCheckoutShippingQuote: (state, action: PayloadAction<number | null>) => {
      state.checkoutShippingUsd = action.payload;
      if (action.payload == null) {
        state.checkoutShippingOptions = null;
        state.checkoutShippingOptionId = null;
      }
    },
    setCheckoutShippingQuoteBundle: (
      state,
      action: PayloadAction<{
        usd: number | null;
        options: CheckoutShippingOption[] | null;
        selectedOptionId: string | null;
      } | null>,
    ) => {
      if (action.payload === null) {
        state.checkoutShippingUsd = null;
        state.checkoutShippingOptions = null;
        state.checkoutShippingOptionId = null;
        return;
      }
      state.checkoutShippingUsd = action.payload.usd;
      state.checkoutShippingOptions = action.payload.options;
      state.checkoutShippingOptionId = action.payload.selectedOptionId;
    },
    setCheckoutShippingOptionPick: (
      state,
      action: PayloadAction<{id: string; usd: number}>,
    ) => {
      state.checkoutShippingOptionId = action.payload.id;
      state.checkoutShippingUsd = action.payload.usd;
    },
    setCardNumber: (state, action: PayloadAction<string>) => {
      state.cardNumber = action.payload;
    },
    setExpiryDate: (state, action: PayloadAction<string>) => {
      state.expiryDate = action.payload;
    },
    setCvv: (state, action: PayloadAction<string>) => {
      state.cvv = action.payload;
    },
    setCardHolderName: (state, action: PayloadAction<string>) => {
      state.cardHolderName = action.payload;
    },
    setCheckoutPaymentSelection: (
      state,
      action: PayloadAction<CheckoutPaymentSelection | null>,
    ) => {
      state.checkoutPaymentSelection = action.payload;
    },
  },
});

export const {
  setName,
  setAddress,
  setCheckoutShippingSelection,
  setCheckoutShippingQuote,
  setCheckoutShippingQuoteBundle,
  setCheckoutShippingOptionPick,
  setCardNumber,
  setExpiryDate,
  setCvv,
  setCardHolderName,
  setCheckoutPaymentSelection,
} = paymentSlice.actions;

export default paymentSlice.reducer;
