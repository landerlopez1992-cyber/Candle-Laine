import type {ShopBannerSlide} from '../types/homeBanner';

export function parseBannerSlides(raw: unknown): ShopBannerSlide[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ShopBannerSlide[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as Record<string, unknown>;
    const path = typeof o.image_path === 'string' ? o.image_path.trim() : '';
    if (!path) {
      continue;
    }
    out.push({
      image_path: path,
      title: typeof o.title === 'string' ? o.title : '',
      subtitle: typeof o.subtitle === 'string' ? o.subtitle : '',
      button_label: typeof o.button_label === 'string' ? o.button_label : '',
      link_path: typeof o.link_path === 'string' ? o.link_path : '/shop',
    });
  }
  return out;
}
