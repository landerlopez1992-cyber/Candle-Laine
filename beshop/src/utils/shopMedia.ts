import {supabase} from '../supabaseClient';

export const SHOP_MEDIA_BUCKET = 'shop-media';

/** Alineado con migración `shop_media_file_size_10mb` (10 MiB). */
export const SHOP_MEDIA_MAX_FILE_BYTES = 10 * 1024 * 1024;

export function getShopMediaPublicUrl(storagePath: string): string {
  if (!supabase || !storagePath) {
    return '';
  }
  const {data} = supabase.storage
    .from(SHOP_MEDIA_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/** Mensaje legible si Storage rechaza por tamaño (inglés en API de Supabase). */
export function formatStorageUploadError(err: {message?: string} | null): string {
  const raw = err?.message ?? '';
  if (
    /exceeded the maximum allowed size|maximum allowed size|payload too large/i.test(
      raw,
    )
  ) {
    return (
      'El archivo supera el límite de tamaño del almacenamiento (máx. 10 MB por imagen tras aplicar la migración del bucket). ' +
      'Prueba a exportar como JPG o WebP (calidad ~80 %) y ancho máximo ~1920 px. ' +
      'Si aún ves 5 MB, ejecuta en Supabase la migración que sube el límite del bucket «shop-media» o cámbialo en Dashboard → Storage → shop-media.'
    );
  }
  return raw || 'No se pudo subir la imagen.';
}

/**
 * Si la imagen pesa mucho, la reescala y convierte a JPEG para caber en el límite del bucket.
 */
async function prepareImageForUpload(file: File): Promise<File> {
  const compressAbove = 4 * 1024 * 1024;
  if (
    file.size <= compressAbove ||
    file.type === 'image/gif' ||
    !file.type.startsWith('image/')
  ) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const maxDim = 1920;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const name = `${file.name.replace(/\.[^.]+$/, '')}-opt.jpg`;
          resolve(new File([blob], name, {type: 'image/jpeg'}));
        },
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/** Sube un archivo y devuelve la ruta dentro del bucket (para guardar en BD). */
export async function uploadShopImage(
  folder: string,
  file: File,
): Promise<{path: string; error: Error | null}> {
  if (!supabase) {
    return {path: '', error: new Error('Supabase no configurado')};
  }
  const toUpload =
    file.type.startsWith('image/') && file.type !== 'image/gif'
      ? await prepareImageForUpload(file)
      : file;
  const ext = toUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
    ? ext
    : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${safeExt}`;
  const {error} = await supabase.storage
    .from(SHOP_MEDIA_BUCKET)
    .upload(path, toUpload, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) {
    return {
      path: '',
      error: new Error(formatStorageUploadError(error)),
    };
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
