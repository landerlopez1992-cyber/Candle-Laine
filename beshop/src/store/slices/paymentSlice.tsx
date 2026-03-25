import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type CheckoutPaymentKind = 'zelle' | 'installments' | 'card';

export type CheckoutPaymentSelection = {
  kind: CheckoutPaymentKind;
  cardId?: string;
};

export interface PaymentState {
  cvv: string;
  name: string;
  address: string;
  cardNumber: string;
  expiryDate: string;
  cardHolderName: string;
  /** Método confirmado en checkout (detalle → Aceptar). */
  checkoutPaymentSelection: CheckoutPaymentSelection | null;
}

const initialState: PaymentState = {
  cvv: '',
  name: '',
  address: '',
  expiryDate: '',
  cardNumber: '',
  cardHolderName: '',
  checkoutPaymentSelection: {kind: 'card', cardId: '1'},
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
  setCardNumber,
  setExpiryDate,
  setCvv,
  setCardHolderName,
  setCheckoutPaymentSelection,
} = paymentSlice.actions;

export default paymentSlice.reducer;
