export type PromocodeType = {
  id: number | string;
  name: string;
  code: string;
  image: string;
  expiry: string;
  /** Porcentaje mostrado; 0 si solo aplica envío gratis. */
  discount: number;
  /** Cupón de envío gratis (sin %). */
  isFreeShipping?: boolean;
};
