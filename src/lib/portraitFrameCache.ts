import { FRAME_COUNT, framePath } from "@/lib/frames";

export type PreloadProgress = {
  loaded: number;
  total: number;
  pct: number;
};

let cache: HTMLImageElement[] | null = null;
let loadPromise: Promise<HTMLImageElement[]> | null = null;
const progressListeners = new Set<(p: PreloadProgress) => void>();

function emitProgress(loaded: number) {
  const p: PreloadProgress = {
    loaded,
    total: FRAME_COUNT,
    pct: Math.round((loaded / FRAME_COUNT) * 100),
  };
  progressListeners.forEach((fn) => fn(p));
}

export function getPortraitFrameCache(): HTMLImageElement[] | null {
  return cache;
}

export function subscribePreloadProgress(
  fn: (p: PreloadProgress) => void,
): () => void {
  progressListeners.add(fn);
  if (cache) fn({ loaded: FRAME_COUNT, total: FRAME_COUNT, pct: 100 });
  return () => progressListeners.delete(fn);
}

export function preloadPortraitFrames(): Promise<HTMLImageElement[]> {
  if (cache) {
    emitProgress(FRAME_COUNT);
    return Promise.resolve(cache);
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const arr: HTMLImageElement[] = new Array(FRAME_COUNT);
    let loaded = 0;
    const batch = 14;

    for (let start = 0; start < FRAME_COUNT; start += batch) {
      await Promise.all(
        Array.from(
          { length: Math.min(batch, FRAME_COUNT - start) },
          (_, j) => {
            const i = start + j;
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.decoding = "async";
              img.src = framePath(i);
              img.onload = () => {
                arr[i] = img;
                loaded += 1;
                emitProgress(loaded);
                resolve();
              };
              img.onerror = () => {
                loaded += 1;
                emitProgress(loaded);
                resolve();
              };
            });
          },
        ),
      );
    }

    cache = arr;
    emitProgress(FRAME_COUNT);
    return arr;
  })();

  return loadPromise;
}
