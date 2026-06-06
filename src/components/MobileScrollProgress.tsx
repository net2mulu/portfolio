"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  CINEMA_CHAPTER_PROGRESS,
  killCinemaScrollTween,
  progressFromTrackX,
  scrollToCinemaProgress,
} from "@/lib/cinemaScroll";

const STEPS = [
  { label: "Hello", icon: "01", chapter: 0 as const },
  { label: "About", icon: "02", chapter: 1 as const },
  { label: "Approach", icon: "03", chapter: 2 as const },
] as const;

const DONE_THRESHOLD = 0.97;
const RING_R = 18;
const RING_C = 2 * Math.PI * RING_R;

type MobileScrollProgressProps = {
  progressRef: React.MutableRefObject<number>;
};

export function MobileScrollProgress({ progressRef }: MobileScrollProgressProps) {
  const gradId = useId().replace(/:/g, "");
  const trackRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const draggingRef = useRef(false);
  const lastStepRef = useRef(-1);

  const [visible, setVisible] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [valueNow, setValueNow] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const applyVisual = useCallback((p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    const pct = Math.round(clamped * 100);
    const track = trackRef.current;
    if (track) track.style.setProperty("--progress", String(clamped));
    if (ringRef.current) {
      ringRef.current.style.strokeDashoffset = String(RING_C * (1 - clamped));
    }
    if (pctRef.current) {
      pctRef.current.textContent = String(pct);
    }
    setValueNow(pct);
    const step = Math.min(STEPS.length - 1, Math.floor(clamped * STEPS.length));
    if (step !== lastStepRef.current) {
      lastStepRef.current = step;
      setActiveStep(step);
    }
  }, []);

  const scrubToClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const p = progressFromTrackX(clientX, rect.left, rect.width);
      applyVisual(p);
      progressRef.current = p;
      scrollToCinemaProgress(p, { animate: false });
    },
    [applyVisual, progressRef],
  );

  useEffect(() => {
    let raf = 0;
    let lastVisible = true;

    const tick = () => {
      if (!draggingRef.current) {
        const p = progressRef.current;
        applyVisual(p);

        const cinema = document.getElementById("scroll-cinema");
        const inCinema =
          !!cinema && cinema.getBoundingClientRect().bottom > 72;
        const nextVisible = p < DONE_THRESHOLD && inCinema;
        if (nextVisible !== lastVisible) {
          lastVisible = nextVisible;
          setVisible(nextVisible);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [applyVisual, progressRef]);

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    killCinemaScrollTween();
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubToClientX(e.clientX);
  };

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    scrubToClientX(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onChapterClick = (chapter: 0 | 1 | 2) => {
    killCinemaScrollTween();
    setIsAnimating(true);
    scrollToCinemaProgress(CINEMA_CHAPTER_PROGRESS[chapter], {
      animate: true,
      onComplete: () => setIsAnimating(false),
    });
  };

  if (!visible) return null;

  const trackClass = [
    "mobile-scroll-progress__track",
    isDragging ? "is-dragging" : "",
    isAnimating ? "is-animating" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mobile-scroll-progress fixed right-3 bottom-5 left-3 z-30 lg:hidden">
      <div
        className={`mobile-scroll-progress__card${isAnimating ? " is-animating" : ""}`}
      >
        <div className="mobile-scroll-progress__ring" aria-hidden>
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2.5"
            />
            <circle
              ref={ringRef}
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              className="mobile-scroll-progress__ring-progress"
            />
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <span ref={pctRef} className="mobile-scroll-progress__pct">
            0
          </span>
        </div>

        <div className="mobile-scroll-progress__body">
          <p className="mobile-scroll-progress__hint">Drag to scroll the story</p>
          <div
            ref={trackRef}
            className={trackClass}
            role="slider"
            aria-label="Story progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={valueNow}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="mobile-scroll-progress__track-rail">
              <div className="mobile-scroll-progress__fill" />
              <span className="mobile-scroll-progress__bead" />
            </div>
          </div>
          <ul className="mobile-scroll-progress__steps">
            {STEPS.map((s, i) => (
              <li key={s.label}>
                <button
                  type="button"
                  className={
                    i === activeStep
                      ? "is-active"
                      : i < activeStep
                        ? "is-done"
                        : undefined
                  }
                  aria-label={`Go to ${s.label}`}
                  aria-current={i === activeStep ? "step" : undefined}
                  onClick={() => onChapterClick(s.chapter)}
                >
                  <span className="mobile-scroll-progress__step-num">
                    {s.icon}
                  </span>
                  <span>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
