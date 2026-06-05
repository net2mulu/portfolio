import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scroll progress targets for Hello / About / Approach */
export const CINEMA_CHAPTER_PROGRESS = [0.05, 0.5, 0.95] as const;

let mobileTrigger: ScrollTrigger | null = null;
let scrollTween: gsap.core.Tween | null = null;

export function setMobileCinemaTrigger(st: ScrollTrigger | null) {
  mobileTrigger = st;
}

export function killCinemaScrollTween() {
  scrollTween?.kill();
  scrollTween = null;
}

function scrollYForProgress(progress: number): number | null {
  const st = mobileTrigger;
  if (!st) return null;
  const p = Math.max(0, Math.min(1, progress));
  return st.start + (st.end - st.start) * p;
}

/** Instant or animated scroll to a 0–1 point in the cinema sequence */
export function scrollToCinemaProgress(
  progress: number,
  options?: { animate?: boolean; duration?: number; onComplete?: () => void },
) {
  const targetY = scrollYForProgress(progress);
  if (targetY == null) return;

  scrollTween?.kill();

  if (!options?.animate) {
    window.scrollTo(0, targetY);
    ScrollTrigger.update();
    options?.onComplete?.();
    return;
  }

  const scroll = { y: window.scrollY };
  scrollTween = gsap.to(scroll, {
    y: targetY,
    duration: options.duration ?? 1.05,
    ease: "power3.inOut",
    overwrite: true,
    onUpdate: () => window.scrollTo(0, scroll.y),
    onComplete: () => {
      scrollTween = null;
      ScrollTrigger.update();
      options?.onComplete?.();
    },
  });
}

export function scrollToCinemaChapter(chapter: 0 | 1 | 2) {
  scrollToCinemaProgress(CINEMA_CHAPTER_PROGRESS[chapter], { animate: true });
}

export function progressFromTrackX(clientX: number, trackLeft: number, trackWidth: number) {
  if (trackWidth <= 0) return 0;
  return Math.max(0, Math.min(1, (clientX - trackLeft) / trackWidth));
}
