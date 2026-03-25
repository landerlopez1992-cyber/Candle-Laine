export type ShopCategory = {
  id: string;
  name: string;
  cover_storage_path: string | null;
  sort_order: number;
  created_at: string;
};

export type ShopSubcategory = {
  id: string;
  category_id: string;
  name: string;
  cover_storage_path: string | null;
  sort_order: number;
  created_at: string;
};

export type ShopProduct = {
  id: string;
  /** Siempre presente: el producto pertenece al menos a esta categoría. */
  category_id: string;
  /** Opcional: si es null, el producto está solo bajo la categoría. */
  subcategory_id: string | null;
  name: string;
  details: string | null;
  image_paths: string[];
  flag_discount: boolean;
  flag_offer: boolean;
  flag_hot: boolean;
  flag_new: boolean;
  weight_grams: number | null;
  stock_quantity: number;
  price_cents: number;
  compare_at_price_cents: number | null;
  created_at: string;
  updated_at: string;
};
