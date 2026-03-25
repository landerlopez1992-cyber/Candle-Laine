import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {ShopHomeCountdownRow} from '../types/shop';
import type {ShopProduct} from '../types/catalog';
import type {ProductType} from '../types';
import {shopProductToProductType} from '../utils/shopCatalogProduct';

export type HomeCountdownDisplay = {
  endsAtIso: string;
  headlineText: string;
  bodyText: string;
  buttonLabel: string;
  /** Oferta con envío gratis vía tarjeta countdown (si admin lo activó). */
  freeShipping: boolean;
  product: ProductType;
};

function buildDisplay(
  row: ShopHomeCountdownRow | null,
  productRow: ShopProduct | null,
): HomeCountdownDisplay | null {
  if (!row || !row.enabled || !row.ends_at || !row.product_id || !productRow) {
    return null;
  }
  const end = new Date(row.ends_at).getTime();
  if (Number.isNaN(end) || end <= Date.now()) {
    return null;
  }
  const product = shopProductToProductType(productRow, null);
  return {
    endsAtIso: row.ends_at,
    headlineText: row.headline_text?.trim() ?? '',
    bodyText: row.body_text?.trim() ?? '',
    buttonLabel: (row.button_label?.trim() || 'Buy now').slice(0, 80),
    freeShipping: Boolean(row.free_shipping),
    product,
  };
}

export const useHomeCountdown = () => {
  const [display, setDisplay] = useState<HomeCountdownDisplay | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setDisplay(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const {data: rowRaw, error} = await supabase
      .from('shop_home_countdown')
      .select(
        'id, enabled, product_id, ends_at, free_shipping, headline_text, body_text, button_label, updated_at',
      )
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error(error);
      setDisplay(null);
      setLoading(false);
      return;
    }

    const row = rowRaw as ShopHomeCountdownRow | null;
    let productRow: ShopProduct | null = null;
    if (row?.product_id) {
      const {data: p, error: pErr} = await supabase
        .from('shop_products')
        .select('*')
        .eq('id', row.product_id)
        .maybeSingle();
      if (!pErr && p) {
        productRow = p as ShopProduct;
      }
    }

    setDisplay(buildDisplay(row, productRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {display, loading, reload: load};
};
