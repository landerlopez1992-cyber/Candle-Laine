/** Lienzo cuadrado blanco, producto recortado y centrado (catálogo). */

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
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
      (b) => (b ? resolve(b) : reject(new Error('Export failed'))),
      type,
      quality,
    );
  });
}

/** Recorte por alpha (para PNG sin fondo). */
function trimByAlphaBounds(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  alphaThreshold = 24,
): {left: number; top: number; right: number; bottom: number} | null {
  let top = h;
  let bottom = 0;
  let left = w;
  let right = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        found = true;
        if (y < top) {
          top = y;
        }
        if (y > bottom) {
          bottom = y;
        }
        if (x < left) {
          left = x;
        }
        if (x > right) {
          right = x;
        }
      }
    }
  }
  if (!found) {
    return null;
  }
  const pad = 4;
  return {
    left: Math.max(0, left - pad),
    top: Math.max(0, top - pad),
    right: Math.min(w - 1, right + pad),
    bottom: Math.min(h - 1, bottom + pad),
  };
}

function hasSignificantTransparency(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): boolean {
  let semi = 0;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const a = data[i * 4 + 3];
    if (a < 250) {
      semi++;
    }
  }
  return semi / n > 0.02;
}

function autoCropBounds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): {left: number; top: number; right: number; bottom: number} | null {
  const detMax = 256;
  const scale = Math.min(1, detMax / w, detMax / h);
  const dw = Math.max(1, Math.round(w * scale));
  const dh = Math.max(1, Math.round(h * scale));
  const det = document.createElement('canvas');
  det.width = dw;
  det.height = dh;
  const dctx = det.getContext('2d');
  if (!dctx) {
    return null;
  }
  dctx.drawImage(ctx.canvas, 0, 0, dw, dh);
  const data = dctx.getImageData(0, 0, dw, dh).data;

  const sample = (x: number, y: number) => {
    const i = (y * dw + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const;
  };

  let rS = 0;
  let gS = 0;
  let bS = 0;
  let cnt = 0;
  const corners: [number, number][] = [
    [0, 0],
    [dw - 2, 0],
    [0, dh - 2],
    [dw - 2, dh - 2],
  ];
  for (const [cx, cy] of corners) {
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const [r, g, b] = sample(
          Math.min(dw - 1, cx + dx),
          Math.min(dh - 1, cy + dy),
        );
        rS += r;
        gS += g;
        bS += b;
        cnt++;
      }
    }
  }
  const bgR = cnt ? Math.round(rS / cnt) : 255;
  const bgG = cnt ? Math.round(gS / cnt) : 255;
  const bgB = cnt ? Math.round(bS / cnt) : 255;
  const tolerance = 28;

  const isBg = (x: number, y: number) => {
    const i = (y * dw + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const nearBg =
      Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) <
      tolerance * 3;
    const nearWhite = r > 222 && g > 222 && b > 222;
    const transp = a < 16;
    return nearBg || nearWhite || transp;
  };

  const threshold = 0.92;
  const rowBg = (row: number) => {
    let c = 0;
    for (let x = 0; x < dw; x++) {
      if (isBg(x, row)) {
        c++;
      }
    }
    return c / dw >= threshold;
  };
  const colBg = (col: number) => {
    let c = 0;
    for (let y = 0; y < dh; y++) {
      if (isBg(col, y)) {
        c++;
      }
    }
    return c / dh >= threshold;
  };

  let t = 0;
  while (t < dh - 1 && rowBg(t)) {
    t++;
  }
  let b = dh - 1;
  while (b > t && rowBg(b)) {
    b--;
  }
  let l = 0;
  while (l < dw - 1 && colBg(l)) {
    l++;
  }
  let r = dw - 1;
  while (r > l && colBg(r)) {
    r--;
  }

  const minPad = 6;
  const top = Math.max(0, Math.round((t / dh) * h) - minPad);
  const bottom = Math.min(h - 1, Math.round((b / dh) * h) + minPad);
  const left = Math.max(0, Math.round((l / dw) * w) - minPad);
  const right = Math.min(w - 1, Math.round((r / dw) * w) + minPad);
  if (right - left < 4 || bottom - top < 4) {
    return null;
  }
  if (left === 0 && top === 0 && right === w - 1 && bottom === h - 1) {
    return null;
  }
  return {left, top, right, bottom};
}

export async function normalizeProductImageForCatalog(
  file: File,
  canvasSize = 800,
): Promise<File> {
  try {
    const img = await loadImageFromBlob(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w < 4 || h < 4) {
      return file;
    }

    const src = document.createElement('canvas');
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d');
    if (!sctx) {
      return file;
    }
    sctx.drawImage(img, 0, 0);
    const fullData = sctx.getImageData(0, 0, w, h);

    const useAlphaTrim = hasSignificantTransparency(fullData.data, w, h);
    const bounds = useAlphaTrim
      ? trimByAlphaBounds(fullData.data, w, h)
      : autoCropBounds(sctx, w, h);

    let cw = w;
    let ch = h;
    let cropCanvas = src;
    if (bounds) {
      cw = bounds.right - bounds.left + 1;
      ch = bounds.bottom - bounds.top + 1;
      const cropped = document.createElement('canvas');
      cropped.width = cw;
      cropped.height = ch;
      const cctx = cropped.getContext('2d');
      if (cctx) {
        cctx.fillStyle = '#ffffff';
        cctx.fillRect(0, 0, cw, ch);
        cctx.drawImage(
          src,
          bounds.left,
          bounds.top,
          cw,
          ch,
          0,
          0,
          cw,
          ch,
        );
        cropCanvas = cropped;
      }
    }

    const margin = Math.round(canvasSize * 0.05);
    const fitSize = canvasSize - margin * 2;
    const scale = Math.min(fitSize / cw, fitSize / ch);
    const nw = Math.max(1, Math.round(cw * scale));
    const nh = Math.max(1, Math.round(ch * scale));

    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    const ox = Math.floor((canvasSize - nw) / 2);
    const oy = Math.floor((canvasSize - nh) / 2);
    ctx.drawImage(cropCanvas, 0, 0, cw, ch, ox, oy, nw, nh);

    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const base = file.name.replace(/\.[^.]+$/, '') || 'producto';
    return new File([blob], `${base}_catalog.jpg`, {type: 'image/jpeg'});
  } catch {
    return file;
  }
}

/** Vista previa del resultado final en el modal (JPEG en lienzo blanco). */
export async function previewCatalogNormalize(file: File): Promise<string> {
  const normalized = await normalizeProductImageForCatalog(file);
  return URL.createObjectURL(normalized);
}
