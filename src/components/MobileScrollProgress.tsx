"use client";

import { useEffect, useId, useState } from "react";

const STEPS = [
  { label: "Hello", icon: "01" },
  { label: "About", icon: "02" },
  { label: "Approach", icon: "03" },
] as const;

const DONE_THRESHOLD = 0.97;

type MobileScrollProgressProps = {
  progressRef: React.MutableRefObject<number>;
};

export function MobileScrollProgress({ progressRef }: MobileScrollProgressProps) {
  const gradId = useId().replace(/:/g, "");
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progressRef.current;
      const cinema = document.getElementById("scroll-cinema");
      const inCinema =
        !!cinema && cinema.getBoundingClientRect().bottom > 72;
      setProgress(p);
      setVisible(p < DONE_THRESHOLD && inCinema);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  if (!visible) return null;

  const pct = Math.round(progress * 100);
  const step = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));
  const circumference = 2 * Math.PI * 18;
  const dash = (progress * circumference).toFixed(2);

  return (
    <div
      className="mobile-scroll-progress pointer-events-none fixed right-3 bottom-5 left-3 z-30 lg:hidden"
      aria-hidden
    >
      <div className="mobile-scroll-progress__card">
        <div className="mobile-scroll-progress__ring" aria-hidden>
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2.5"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - Number(dash)}
            />
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <span className="mobile-scroll-progress__pct">{pct}</span>
        </div>

        <div className="mobile-scroll-progress__body">
          <p className="mobile-scroll-progress__hint">Scroll the story</p>
          <div className="mobile-scroll-progress__track">
            <div
              className="mobile-scroll-progress__fill"
              style={{ transform: `scaleX(${progress})` }}
            />
            <span
              className="mobile-scroll-progress__bead"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
          <ul className="mobile-scroll-progress__steps">
            {STEPS.map((s, i) => (
              <li
                key={s.label}
                className={
                  i === step ? "is-active" : i < step ? "is-done" : undefined
                }
              >
                <span className="mobile-scroll-progress__step-num">{s.icon}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
