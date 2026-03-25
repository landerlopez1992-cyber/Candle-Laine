import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {ProductType} from '../types';
import type {ShopHomeCountdownRow} from '../types/shop';
import type {ShopProduct} from '../types/catalog';
import {shopProductToProductType} from '../utils/shopCatalogProduct';

export type HomeCountdownDisplay = {
  endsAtIso: string;
  bodyText: string;
  buttonLabel: string;
  product: ProductType;
};

type CountdownJoinRow = ShopHomeCountdownRow & {
  shop_products: ShopProduct | null;
};

function rowToDisplay(row: CountdownJoinRow | null): HomeCountdownDisplay | null {
  if (!row || !row.enabled || !row.ends_at || !row.product_id) {
    return null;
  }
  const p = row.shop_products;
  if (!p) {
    return null;
  }
  const end = new Date(row.ends_at).getTime();
  if (Number.isNaN(end) || end <= Date.now()) {
    return null;
  }
  const product = shopProductToProductType(p, null);
  return {
    endsAtIso: row.ends_at,
    bodyText: row.body_text?.trim() ?? '',
    buttonLabel: (row.button_label?.trim() || 'Buy now').slice(0, 80),
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
    const {data, error} = await supabase
      .from('shop_home_countdown')
      .select(
        `
        id,
        enabled,
        product_id,
        ends_at,
        body_text,
        button_label,
        updated_at,
        shop_products (
          id,
          category_id,
          subcategory_id,
          name,
          details,
          image_paths,
          flag_discount,
          flag_offer,
          flag_hot,
          flag_new,
          weight_grams,
          stock_quantity,
          price_cents,
          compare_at_price_cents,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error(error);
      setDisplay(null);
    } else {
      setDisplay(rowToDisplay(data as CountdownJoinRow | null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {display, loading, reload: load};
};
