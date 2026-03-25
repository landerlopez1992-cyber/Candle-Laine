import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';
import {isSupabaseConfigured, supabase} from '../supabaseClient';
import type {ProductType} from '../types';
import type {ShopProduct} from '../types/catalog';
import {shopProductToProductType} from '../utils/shopCatalogProduct';

async function mapShopProductsWithRatings(
  rows: ShopProduct[],
): Promise<ProductType[]> {
  if (!supabase || rows.length === 0) {
    return rows.map((sp) => shopProductToProductType(sp, null));
  }
  const ids = rows.map((r) => r.id);
  const statsById = new Map<
    string,
    {avg_rating: number; review_count: number}
  >();
  const {data: statRows, error: statErr} = await supabase
    .from('shop_product_rating_stats')
    .select('product_id, avg_rating, review_count')
    .in('product_id', ids);
  if (!statErr && statRows) {
    for (const s of statRows as {
      product_id: string;
      avg_rating: number;
      review_count: number;
    }[]) {
      statsById.set(s.product_id, {
        avg_rating: Number(s.avg_rating),
        review_count: s.review_count,
      });
    }
  }
  return rows.map((sp) =>
    shopProductToProductType(sp, statsById.get(sp.id) ?? null),
  );
}

/**
 * Con Supabase configurado: catálogo real (`shop_products`).
 * Sin Supabase: JSON demo (comportamiento original).
 * `categoryId`: opcional; si se pasa, solo esa categoría.
 */
export const useProducts = (categoryId?: string | null) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setProductsLoading(true);

      const useDb = supabase && isSupabaseConfigured;

      if (useDb) {
        try {
          let q = supabase!
            .from('shop_products')
            .select('*')
            .order('created_at', {ascending: false});
          if (categoryId) {
            q = q.eq('category_id', categoryId);
          }
          const {data, error} = await q;

          if (cancelled) {
            return;
          }

          if (error) {
            console.error(error);
            setProducts([]);
          } else {
            const rows = (data ?? []) as ShopProduct[];
            setProducts(await mapShopProductsWithRatings(rows));
          }
        } catch (e) {
          console.error(e);
          if (!cancelled) {
            setProducts([]);
          }
        } finally {
          if (!cancelled) {
            setProductsLoading(false);
          }
        }
        return;
      }

      try {
        const response = await axios.get(URLS.GET_PRODUCTS);
        if (!cancelled) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return {productsLoading, products};
};
