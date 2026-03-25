import type {ProductType} from '../types';
import type {ShopProduct} from '../types/catalog';
import {supabase} from '../supabaseClient';
import {shopProductToProductType} from './shopCatalogProduct';
import {isUuid} from './isUuid';

export async function loadUserCart(userId: string): Promise<ProductType[]> {
  if (!supabase) {
    return [];
  }
  const {data, error} = await supabase
    .from('user_cart_items')
    .select('quantity, shop_products(*)')
    .eq('user_id', userId);

  if (error || !data) {
    console.error(error);
    return [];
  }

  const out: ProductType[] = [];
  /** PostgREST suele devolver el embed como array aunque sea relación 1:1. */
  type CartRow = {
    quantity: number;
    shop_products: ShopProduct | ShopProduct[] | null;
  };
  for (const row of data as CartRow[]) {
    const raw = row.shop_products;
    const p = Array.isArray(raw) ? raw[0] ?? null : raw;
    if (!p) {
      continue;
    }
    const pt = shopProductToProductType(p);
    pt.quantity = row.quantity;
    out.push(pt);
  }
  return out;
}

export async function syncCartToServer(
  userId: string,
  list: ProductType[],
): Promise<void> {
  if (!supabase) {
    return;
  }
  const {error: delErr} = await supabase
    .from('user_cart_items')
    .delete()
    .eq('user_id', userId);
  if (delErr) {
    console.error(delErr);
    return;
  }

  const rows = list
    .filter((p) => typeof p.id === 'string' && isUuid(p.id))
    .map((p) => ({
      user_id: userId,
      product_id: p.id as string,
      quantity: p.quantity ?? 1,
    }));

  if (rows.length === 0) {
    return;
  }

  const {error: insErr} = await supabase.from('user_cart_items').insert(rows);
  if (insErr) {
    console.error(insErr);
  }
}
