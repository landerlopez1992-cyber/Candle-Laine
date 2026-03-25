import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {ReviewType} from '../types';
import {
  mapProductReviewRows,
  type ProductReviewRow,
} from '../utils/mapProductReview';

export type ShopProductRatingStat = {
  product_id: string;
  avg_rating: number;
  review_count: number;
};

/**
 * Reseñas de un producto (`shop_products.id`) y estadísticas agregadas.
 * Sin `productId` no hace peticiones.
 */
export const useProductReviews = (productId: string | undefined) => {
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const load = useCallback(async () => {
    if (!supabase || !productId) {
      setReviews([]);
      setAverageRating(null);
      setReviewCount(0);
      setReviewsError(null);
      setReviewsLoading(false);
      return;
    }

    setReviewsLoading(true);
    setReviewsError(null);

    const statPromise = supabase
      .from('shop_product_rating_stats')
      .select('product_id, avg_rating, review_count')
      .eq('product_id', productId)
      .maybeSingle();

    const listPromise = supabase
      .from('product_reviews')
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        profiles ( full_name, email )
      `,
      )
      .eq('product_id', productId)
      .order('created_at', {ascending: false})
      .limit(100);

    const [statRes, listRes] = await Promise.all([statPromise, listPromise]);

    if (statRes.error) {
      setReviewsError(statRes.error.message);
    }
    if (listRes.error) {
      setReviewsError(listRes.error.message);
    }

    const stat = statRes.data as ShopProductRatingStat | null;
    const raw = (listRes.data ?? []) as ProductReviewRow[];
    const mapped = mapProductReviewRows(raw);
    setReviews(mapped);

    if (stat?.review_count && stat.avg_rating != null) {
      setAverageRating(Number(stat.avg_rating));
      setReviewCount(stat.review_count);
    } else if (mapped.length > 0) {
      const sum = mapped.reduce((s, r) => s + r.rating, 0);
      setAverageRating(Math.round((sum / mapped.length) * 10) / 10);
      setReviewCount(mapped.length);
    } else {
      setAverageRating(null);
      setReviewCount(0);
    }

    setReviewsLoading(false);
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    reviews,
    reviewsLoading,
    reviewsError,
    averageRating,
    reviewCount,
    refetchReviews: load,
  };
};
