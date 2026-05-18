/** Redimensiona antes del motor de quitar fondo (máx. 1024 px). */

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo exportar la imagen.'));
        }
      },
      type,
      quality,
    );
  });
}

export async function prepareImageForBackgroundRemoval(
  file: File,
): Promise<File> {
  try {
    const img = await loadImageFromFile(file);
    const maxSide = 1024;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxSide || h > maxSide) {
      if (w >= h) {
        h = Math.round((h * maxSide) / w);
        w = maxSide;
      } else {
        w = Math.round((w * maxSide) / h);
        h = maxSide;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }
    ctx.drawImage(img, 0, 0, w, h);
    const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
    if (hasAlpha) {
      const blob = await canvasToBlob(canvas, 'image/png');
      const base = file.name.replace(/\.[^.]+$/, '') || 'producto';
      return new File([blob], `${base}_prep.png`, {type: 'image/png'});
    }
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const base = file.name.replace(/\.[^.]+$/, '') || 'producto';
    return new File([blob], `${base}_prep.jpg`, {type: 'image/jpeg'});
  } catch {
    return file;
  }
}
