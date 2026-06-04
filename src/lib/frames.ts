export const FRAME_COUNT = 124;

/** Processed transparent frames from public/new_frames via scripts/process_frames.py */
const FRAME_DELAY = "0.041s";

export function framePath(index: number): string {
  const i = Math.max(0, Math.min(FRAME_COUNT - 1, index));
  return `/assets/frames/frame_${String(i).padStart(3, "0")}_delay-${FRAME_DELAY}.webp`;
}

export const FRAME_PATHS = Array.from({ length: FRAME_COUNT }, (_, i) =>
  framePath(i),
);
