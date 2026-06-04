/**
 * Forwards wheel/touch scroll from the pinned mobile hero to the document
 * so ScrollTrigger advances when the user scrolls over text (not only the portrait).
 */
export function bindMobileScrollProxy(target: HTMLElement) {
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
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
    const delta = touchY - y;
    touchY = y;
    if (Math.abs(delta) < 2) return;
    window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    e.preventDefault();
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
    target.removeEventListener("wheel", onWheel);
    target.removeEventListener("touchstart", onTouchStart);
    target.removeEventListener("touchmove", onTouchMove);
    target.removeEventListener("touchend", onTouchEnd);
    target.removeEventListener("touchcancel", onTouchEnd);
  };
}
