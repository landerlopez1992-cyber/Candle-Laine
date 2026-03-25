import {useState, useEffect} from 'react';

import type {CategoryType} from '../types';
import {supabase} from '../supabaseClient';
import {getShopMediaPublicUrl} from '../utils/shopMedia';

/** Imagen neutra si la categoría no tiene portada en Storage (solo datos; mismo layout). */
const PLACEHOLDER_COVER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect fill="#e8e8e8" width="100%" height="100%"/></svg>',
  );

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setCategoriesLoading(true);

      if (!supabase) {
        if (!cancelled) {
          setCategories([]);
          setCategoriesLoading(false);
        }
        return;
      }

      try {
        const {data, error} = await supabase
          .from('shop_categories')
          .select('id, name, cover_storage_path, sort_order')
          .order('sort_order', {ascending: true});

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(error);
          setCategories([]);
        } else {
          const rows = (data ?? []) as {
            id: string;
            name: string;
            cover_storage_path: string | null;
          }[];
          const mapped: CategoryType[] = rows.map((row) => ({
            id: row.id,
            name: row.name,
            image: row.cover_storage_path
              ? getShopMediaPublicUrl(row.cover_storage_path)
              : PLACEHOLDER_COVER,
          }));
          setCategories(mapped);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {categoriesLoading, categories};
};
