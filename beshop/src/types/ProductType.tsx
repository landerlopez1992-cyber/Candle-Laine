import {ColorType} from './ColorType';
import {ReviewType} from './ReviewType';

export type ProductType = {
  /** Número (JSON demo) o UUID string (Supabase `shop_products`). */
  id: number | string;
  name: string;
  price: number;
  rating: number;
  image: string;
  images: string[];
  sizes: string[];
  size: string;
  colors: ColorType[];
  color: string;
  description: string;
  categories: string;
  is_bestseller: boolean;
  oldPrice?: number;
  quantity?: number;
  reviews: ReviewType[];
  types: string[];
  isNew: boolean;
  isTop: boolean;
  isFeatured: boolean;
  audience: string[];
  promotion: string;
  tags: string[];
  style: string;
  imageColor: string;
};
