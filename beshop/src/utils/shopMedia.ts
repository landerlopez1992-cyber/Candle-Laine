import {supabase} from '../supabaseClient';

export const SHOP_MEDIA_BUCKET = 'shop-media';

export function getShopMediaPublicUrl(storagePath: string): string {
  if (!supabase || !storagePath) {
    return '';
  }
  const {data} = supabase.storage
    .from(SHOP_MEDIA_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Sube un archivo y devuelve la ruta dentro del bucket (para guardar en BD). */
export async function uploadShopImage(
  folder: string,
  file: File,
): Promise<{path: string; error: Error | null}> {
  if (!supabase) {
    return {path: '', error: new Error('Supabase no configurado')};
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
    ? ext
    : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${safeExt}`;
  const {error} = await supabase.storage
    .from(SHOP_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    return {path: '', error: error as Error};
  }
  return {path, error: null};
}

export function dollarsToCents(value: string): number {
  const n = parseFloat(value.replace(',', '.').replace(/[^\d.-]/g, ''));
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
