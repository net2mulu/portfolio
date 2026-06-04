/** Source frames on disk (0–123) */
export const SOURCE_FRAME_COUNT = 124;

/** Skip every Nth source frame for playback (2 ≈ 62 frames, smoother CPU/GPU) */
export const FRAME_STRIDE = 2;

/** Frames used for scroll scrubbing */
export const FRAME_COUNT = Math.ceil(SOURCE_FRAME_COUNT / FRAME_STRIDE);

const FRAME_DELAY = "0.041s";

export function framePath(displayIndex: number): string {
  const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, displayIndex));
  const sourceIndex = Math.min(
    SOURCE_FRAME_COUNT - 1,
    clamped * FRAME_STRIDE,
  );
  return `/assets/frames/frame_${String(sourceIndex).padStart(3, "0")}_delay-${FRAME_DELAY}.webp`;
}

export const FRAME_PATHS = Array.from({ length: FRAME_COUNT }, (_, i) =>
  framePath(i),
);
