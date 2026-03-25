/** Una diapositiva del carrusel (persistida en `shop_home_banners.slides`). */
export type ShopBannerSlide = {
  image_path: string;
  title: string;
  subtitle: string;
  button_label: string;
  /** Ruta interna (ej. /shop) o URL https completa. */
  link_path: string;
};

export type ShopHomeBannerRow = {
  id: 'banner_1' | 'banner_2';
  slide_interval_ms: number;
  slides: ShopBannerSlide[];
  updated_at: string;
};

/** Vista ya resuelta para el Home (URLs públicas). */
export type HomeBannerView = {
  slideIntervalMs: number;
  slides: {
    imageUrl: string;
    title: string;
    subtitle: string;
    buttonLabel: string;
    linkPath: string;
  }[];
};
