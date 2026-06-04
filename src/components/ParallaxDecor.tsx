"use client";

export function ParallaxDecor() {
  return (
    <div
      className="decor-layer pointer-events-none fixed inset-0 z-[5] overflow-visible lg:z-[12]"
      aria-hidden
    >
      <svg
        className="decor-wave absolute left-[-2%] top-[32%] w-[min(48vw,560px)] opacity-[0.04] max-lg:opacity-[0.05]"
        viewBox="0 0 400 120"
        fill="none"
      >
        <path
          d="M0 60 C80 20, 160 100, 240 50 S360 30, 400 60"
          stroke="url(#orangeGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.02" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
