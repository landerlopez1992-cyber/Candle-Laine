import {ProductType} from './ProductType';

export type OrderType = {
  /** UUID del pedido en Supabase */
  id: string;
  /** Número visible (ej. CL-123456) */
  humanNumber: string;
  date: string;
  status:
    | 'shipping'
    | 'pending'
    | 'delivered'
    | 'canceled'
    | 'pending_payment'
    | 'paid';
  total: number;
  products: ProductType[];
};
