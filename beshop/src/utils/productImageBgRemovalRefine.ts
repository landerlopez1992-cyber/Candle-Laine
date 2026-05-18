/** Refina PNG del modelo cuando el origen tenía fondo blanco plano (evita ruido/halos). */

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
      reject(new Error('read failed'));
    };
    img.src = url;
  });
}

/** Foto ya con marco blanco uniforme — el modelo de IA suele fallar. */
export async function productImageLooksLikeFlatWhiteBackdrop(
  file: File,
): Promise<boolean> {
  try {
    const img = await loadImageFromFile(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w < 48 || h < 48) {
      return false;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) {
      return false;
    }
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    let n = 0;
    let hi = 0;
    const step = Math.max(1, Math.floor(Math.min(w, h) / 64));

    const sample = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      n++;
      if (lum > 236 && sat < 38) {
        hi++;
      }
    };

    for (let x = 0; x < w; x += step) {
      sample(x, 0);
      sample(x, h - 1);
    }
    for (let y = 0; y < h; y += step) {
      sample(0, y);
      sample(w - 1, y);
    }
    return n > 12 && hi / n > 0.72;
  } catch {
    return false;
  }
}

function fractionClearlyTransparent(data: Uint8ClampedArray, w: number, h: number): number {
  let t = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] < 20) {
      t++;
    }
  }
  return n > 0 ? t / n : 0;
}

function isWalkableWhite(data: Uint8ClampedArray, w: number, x: number, y: number): boolean {
  const i = (y * w + x) * 4;
  const a = data[i + 3];
  if (a < 30) {
    return false;
  }
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const lum = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  return lum > 228 && sat < 48;
}

function floodFillBackdropWhite(data: Uint8ClampedArray, w: number, h: number): void {
  const visited = new Uint8Array(w * h);
  const q: number[] = [];

  const tryStart = (x: number, y: number) => {
    const i = y * w + x;
    if (visited[i] || !isWalkableWhite(data, w, x, y)) {
      return;
    }
    visited[i] = 1;
    q.push(i);
  };

  tryStart(0, 0);
  tryStart(w - 1, 0);
  tryStart(0, h - 1);
  tryStart(w - 1, h - 1);

  while (q.length) {
    const i = q.pop()!;
    const x = i % w;
    const y = (i / w) | 0;
    const pi = i * 4;
    data[pi + 3] = 0;

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
        continue;
      }
      const ni = ny * w + nx;
      if (visited[ni]) {
        continue;
      }
      if (!isWalkableWhite(data, w, nx, ny)) {
        continue;
      }
      visited[ni] = 1;
      q.push(ni);
    }
  }
}

function hasTransparentNeighbor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
): boolean {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
        return true;
      }
      if (data[(ny * w + nx) * 4 + 3] < 72) {
        return true;
      }
    }
  }
  return false;
}

function softenNearWhiteOpaqueHalos(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let a = data[i + 3];
      if (a < 12) {
        continue;
      }
      if (!hasTransparentNeighbor(data, w, h, x, y)) {
        continue;
      }
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum >= 242 && sat <= 32) {
        const t = Math.max(0, Math.min(45, lum - 215)) / 45;
        const cap = Math.round(255 * (1 - t * t));
        if (a > cap) {
          a = cap;
        }
        data[i + 3] = a;
      }
    }
  }
}

export async function refineBackgroundRemovalPng(
  preparedSource: File,
  pngBlob: Blob,
): Promise<Blob> {
  const looksFlat = await productImageLooksLikeFlatWhiteBackdrop(preparedSource);
  if (!looksFlat) {
    return pngBlob;
  }

  try {
    const img = await loadImageFromFile(
      new File([pngBlob], 'cutout.png', {type: 'image/png'}),
    );
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) {
      return pngBlob;
    }
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const {data} = imageData;

    if (fractionClearlyTransparent(data, w, h) < 0.04) {
      floodFillBackdropWhite(data, w, h);
    }
    softenNearWhiteOpaqueHalos(data, w, h);
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
    });
  } catch {
    return pngBlob;
  }
}
