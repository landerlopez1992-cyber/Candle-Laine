import {useState, useEffect} from 'react';
import axios from 'axios';

import {URLS} from '../config';
import {supabase} from '../supabaseClient';
import type {ProductType} from '../types';
import type {ShopProduct} from '../types/catalog';
import {shopProductToProductType} from '../utils/shopCatalogProduct';

/**
 * Sin `categoryId`: productos del JSON demo (comportamiento original).
 * Con `categoryId`: productos reales de `shop_products` filtrados por categoría.
 */
export const useProducts = (categoryId?: string | null) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setProductsLoading(true);

      if (categoryId && supabase) {
        try {
          const {data, error} = await supabase
            .from('shop_products')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', {ascending: false});

          if (cancelled) {
            return;
          }

          if (error) {
            console.error(error);
            setProducts([]);
          } else {
            const rows = data ?? [];
            const ids = rows.map((r) => (r as ShopProduct).id);
            const statsById = new Map<
              string,
              {avg_rating: number; review_count: number}
            >();
            if (ids.length) {
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
            }
            setProducts(
              rows.map((row) => {
                const sp = row as ShopProduct;
                return shopProductToProductType(
                  sp,
                  statsById.get(sp.id) ?? null,
                );
              }),
            );
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
