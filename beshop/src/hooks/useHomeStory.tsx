import {useState, useEffect, useCallback} from 'react';

import {supabase} from '../supabaseClient';
import type {ShopHomeStoryRow} from '../types/shop';
import {getShopMediaPublicUrl} from '../utils/shopMedia';

export type HomeStoryView = {
  title: string;
  bodyText: string;
  imageUrls: string[];
};

function rowToView(row: ShopHomeStoryRow | null): HomeStoryView | null {
  if (!row) {
    return null;
  }
  const paths = row.image_paths ?? [];
  return {
    title: row.title?.trim() ?? '',
    bodyText: row.body_text ?? '',
    imageUrls: paths.map((p) => getShopMediaPublicUrl(p)).filter(Boolean),
  };
}

/** Muestra el bloque solo si hay texto o al menos una imagen (el título acompaña). */
export function hasHomeStoryContent(v: HomeStoryView | null): boolean {
  if (!v) {
    return false;
  }
  return Boolean(v.bodyText.trim()) || v.imageUrls.length > 0;
}

export const useHomeStory = () => {
  const [story, setStory] = useState<HomeStoryView | null>(null);
  const [storyLoading, setStoryLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setStory(null);
      setStoryLoading(false);
      return;
    }
    setStoryLoading(true);
    const {data, error} = await supabase
      .from('shop_home_story')
      .select('id, title, body_text, image_paths, updated_at')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error(error);
      setStory(null);
    } else {
      setStory(rowToView(data as ShopHomeStoryRow | null));
    }
    setStoryLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {story, storyLoading, refetchStory: load};
};
