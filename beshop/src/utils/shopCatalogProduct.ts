import type {ColorType, ProductType} from '../types';
import type {ShopProduct} from '../types/catalog';
import {getShopMediaPublicUrl} from './shopMedia';

/** Colores mínimos para que la pantalla de producto del tema no falle con `.colors[1]`. */
const PLACEHOLDER_COLORS: ColorType[] = [
  {id: 1, name: 'Default', code: '#E8E8E8'},
  {id: 2, name: 'Alt', code: '#CCCCCC'},
];

export type ShopProductRatingStats = {
  avg_rating: number;
  review_count: number;
};

/** Adapta un producto de Supabase al tipo que esperan grid, carrito y ficha. */
export function shopProductToProductType(
  p: ShopProduct,
  ratingStats?: ShopProductRatingStats | null,
): ProductType {
  const paths = p.image_paths ?? [];
  const imageUrls = paths.map((path) => getShopMediaPublicUrl(path));
  const mainImage = imageUrls[0] ?? '';
  const price = Math.round((p.price_cents / 100) * 100) / 100;
  const oldPrice =
    p.compare_at_price_cents != null
      ? Math.round((p.compare_at_price_cents / 100) * 100) / 100
      : undefined;

  const ratingFromReviews =
    ratingStats &&
    ratingStats.review_count > 0 &&
    ratingStats.avg_rating != null
      ? Math.round(Number(ratingStats.avg_rating) * 10) / 10
      : 4.5;

  return {
    id: p.id,
    name: p.name,
    price,
    rating: ratingFromReviews,
    image: mainImage,
    images: imageUrls.length ? imageUrls : [mainImage],
    sizes: [],
    size: '',
    colors: PLACEHOLDER_COLORS,
    color: PLACEHOLDER_COLORS[0].name,
    description: p.details ?? '',
    categories: '',
    is_bestseller: p.flag_hot,
    oldPrice,
    quantity: p.stock_quantity,
    reviews: [],
    types: [],
    isNew: p.flag_new,
    isTop: p.flag_hot,
    isFeatured: p.flag_offer,
    audience: [],
    promotion: '',
    tags: [],
    style: '',
    imageColor: '',
    flag_discount: p.flag_discount,
    weight_grams: p.weight_grams,
  };
}
