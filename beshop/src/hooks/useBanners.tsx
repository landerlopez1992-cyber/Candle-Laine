import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {HomeBannerView} from '../types/homeBanner';
import {getShopMediaPublicUrl} from '../utils/shopMedia';
import {parseBannerSlides} from '../utils/homeBannerSlides';

function rowToView(
  row: {slide_interval_ms: number; slides: unknown} | null | undefined,
): HomeBannerView | null {
  if (!row) {
    return null;
  }
  const slides = parseBannerSlides(row.slides).map((s) => ({
    imageUrl: getShopMediaPublicUrl(s.image_path),
    title: s.title,
    subtitle: s.subtitle,
    buttonLabel: s.button_label,
    linkPath: s.link_path?.trim() || '/shop',
  }));
  return {
    slideIntervalMs: row.slide_interval_ms,
    slides,
  };
}

export const useBanners = () => {
  const [banner1, setBanner1] = useState<HomeBannerView | null>(null);
  const [banner2, setBanner2] = useState<HomeBannerView | null>(null);
  const [bannersLoading, setBannersLoading] = useState(true);

  const refetchBanners = useCallback(async () => {
    if (!supabase) {
      setBanner1(null);
      setBanner2(null);
      setBannersLoading(false);
      return;
    }
    setBannersLoading(true);
    const {data, error} = await supabase
      .from('shop_home_banners')
      .select('id, slide_interval_ms, slides')
      .in('id', ['banner_1', 'banner_2']);

    if (error) {
      console.error(error);
      setBanner1(null);
      setBanner2(null);
    } else {
      const r1 = data?.find((r) => r.id === 'banner_1');
      const r2 = data?.find((r) => r.id === 'banner_2');
      setBanner1(rowToView(r1));
      setBanner2(rowToView(r2));
    }
    setBannersLoading(false);
  }, []);

  useEffect(() => {
    void refetchBanners();
  }, [refetchBanners]);

  return {bannersLoading, banner1, banner2, refetchBanners};
};
