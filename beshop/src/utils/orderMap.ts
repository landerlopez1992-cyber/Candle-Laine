import type {ColorType} from '../types';
import type {OrderType} from '../types/OrderType';
import type {ProductType} from '../types/ProductType';
import {formatOrderDate} from './orderFormatting';
import {getShopMediaPublicUrl} from './shopMedia';

const PLACEHOLDER_COLORS: ColorType[] = [
  {id: 1, name: 'Default', code: '#E8E8E8'},
  {id: 2, name: 'Alt', code: '#CCCCCC'},
];

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
};

/** Línea con join opcional a catálogo (imagen real si falta snapshot). */
export type OrderItemJoin = OrderItemRow & {
  shop_products?: {image_paths?: string[] | null} | null | Array<{
    image_paths?: string[] | null;
  }>;
};

export type OrderRowDb = {
  id: string;
  user_id: string | null;
  status: string;
  total_cents: number;
  currency: string;
  human_order_number: string | null;
  payment_method: string | null;
  created_at: string;
  order_items?: OrderItemJoin[] | null;
};

/**
 * Select de PostgREST: snapshot + `shop_products` para URL pública si `image_url` es null.
 */
export const SUPABASE_ORDER_SELECT = `
  *,
  order_items(
    id,
    order_id,
    product_id,
    name,
    image_url,
    unit_price_cents,
    quantity,
    shop_products(image_paths)
  )
`;

function asOrderItemArray(raw: unknown): OrderItemJoin[] {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr as OrderItemJoin[];
}

function resolveOrderItemImageUrl(oi: OrderItemJoin): string {
  const snap = oi.image_url?.trim();
  if (snap) {
    return snap;
  }
  const rawSp = oi.shop_products;
  const sp = Array.isArray(rawSp) ? rawSp[0] : rawSp;
  const path = sp?.image_paths?.[0];
  if (path) {
    return getShopMediaPublicUrl(path);
  }
  return '';
}

export function productFromOrderItem(oi: OrderItemJoin): ProductType {
  const price = Math.round((oi.unit_price_cents / 100) * 100) / 100;
  const img = resolveOrderItemImageUrl(oi);
  return {
    id: oi.product_id ?? oi.id,
    name: oi.name,
    price,
    quantity: oi.quantity,
    image: img,
    images: img ? [img] : [],
    rating: 4.5,
    sizes: [],
    size: '',
    colors: PLACEHOLDER_COLORS,
    color: PLACEHOLDER_COLORS[0].name,
    description: '',
    categories: '',
    is_bestseller: false,
    reviews: [],
    types: [],
    isNew: false,
    isTop: false,
    isFeatured: false,
    audience: [],
    promotion: '',
    tags: [],
    style: '',
    imageColor: '',
  };
}

export function mapDbStatusToOrderUi(
  status: string,
): OrderType['status'] {
  switch (status) {
    case 'pending_payment':
      return 'pending_payment';
    case 'paid':
      return 'paid';
    case 'created':
      return 'pending';
    case 'processing':
      return 'shipping';
    case 'shipped':
      return 'delivered';
    case 'cancelled':
      return 'canceled';
    default:
      return 'pending';
  }
}

export function mapOrderRowToOrderType(row: unknown): OrderType {
  const r = row as Record<string, unknown>;
  const items = asOrderItemArray(r.order_items);
  const products = items.map(productFromOrderItem);
  const humanNumber =
    (r.human_order_number as string | null | undefined) ??
    String(r.id).replace(/-/g, '').slice(0, 8).toUpperCase();
  return {
    id: r.id as string,
    humanNumber,
    date: formatOrderDate(r.created_at as string),
    status: mapDbStatusToOrderUi(String(r.status)),
    total: (r.total_cents as number) / 100,
    products,
  };
}

export function orderStatusLabel(status: OrderType['status']): string {
  switch (status) {
    case 'pending_payment':
      return 'Pending payment';
    case 'paid':
      return 'Paid';
    case 'pending':
      return 'Order placed';
    case 'shipping':
      return 'On its way';
    case 'delivered':
      return 'Delivered';
    case 'canceled':
      return 'Canceled';
    default:
      return '';
  }
}
