/** Quita el fondo en el navegador (@imgly/background-removal vía esm.sh). */

type BgRemovalModule = {
  removeBackground: (
    image: File,
    options?: {
      model?: string;
      output?: {format?: string; quality?: number};
      progress?: (key: string, current: number, total: number) => void;
    },
  ) => Promise<Blob>;
};

let modulePromise: Promise<BgRemovalModule> | null = null;

function loadBgRemovalModule(): Promise<BgRemovalModule> {
  if (!modulePromise) {
    const url =
      'https://esm.sh/@imgly/background-removal@1.7.0?deps=onnxruntime-web@1.21.0';
    modulePromise = import(/* webpackIgnore: true */ url) as Promise<BgRemovalModule>;
  }
  return modulePromise;
}

export async function removeProductBackground(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const {removeBackground} = await loadBgRemovalModule();
  return removeBackground(file, {
    model: 'isnet',
    output: {format: 'image/png', quality: 1},
    progress: (_key, current, total) => {
      if (total > 0 && onProgress) {
        onProgress(Math.round((current / total) * 100));
      }
    },
  });
}
