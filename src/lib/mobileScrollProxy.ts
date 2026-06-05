/**
 * Forwards wheel/touch scroll from the pinned mobile hero to the document
 * so ScrollTrigger advances when the user scrolls over text (not only the portrait).
 * Real devices get higher gain — less finger travel per story step.
 */
export function bindMobileScrollProxy(target: HTMLElement) {
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  const touchGain = coarse ? 1.78 : 1.4;
  const wheelGain = coarse ? 1.25 : 1.1;

  let pendingDelta = 0;
  let rafId = 0;

  const flush = () => {
    rafId = 0;
    if (pendingDelta === 0) return;
    window.scrollBy({ top: pendingDelta, left: 0, behavior: "auto" });
    pendingDelta = 0;
  };

  const queueScroll = (delta: number) => {
    pendingDelta += delta;
    if (!rafId) rafId = requestAnimationFrame(flush);
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    queueScroll(e.deltaY * wheelGain);
  };

  let touchY = 0;
  let touching = false;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    touching = true;
    touchY = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touching || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    const delta = (touchY - y) * touchGain;
    touchY = y;
    if (Math.abs(delta) < 0.35) return;
    e.preventDefault();
    queueScroll(delta);
  };

  const onTouchEnd = () => {
    touching = false;
  };

  target.addEventListener("wheel", onWheel, { passive: false });
  target.addEventListener("touchstart", onTouchStart, { passive: true });
  target.addEventListener("touchmove", onTouchMove, { passive: false });
  target.addEventListener("touchend", onTouchEnd);
  target.addEventListener("touchcancel", onTouchEnd);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    target.removeEventListener("wheel", onWheel);
    target.removeEventListener("touchstart", onTouchStart);
    target.removeEventListener("touchmove", onTouchMove);
    target.removeEventListener("touchend", onTouchEnd);
    target.removeEventListener("touchcancel", onTouchEnd);
  };
}
