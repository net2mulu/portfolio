"use client";

import { portraitStackTags, portraitStackTagsMobile } from "@/lib/content";

type PortraitVoidArtProps = {
  variant?: "desktop" | "mobile";
};

const ORBS = [
  { x: "18%", y: "22%", size: 6, delay: 0 },
  { x: "72%", y: "14%", size: 4, delay: 0.4 },
  { x: "48%", y: "32%", size: 8, delay: 0.8 },
  { x: "85%", y: "28%", size: 5, delay: 1.2 },
] as const;

export function PortraitVoidArt({ variant = "desktop" }: PortraitVoidArtProps) {
  const tags = variant === "mobile" ? portraitStackTagsMobile : portraitStackTags;

  return (
    <div
      className={`portrait-void-art portrait-void-art--${variant}`}
      aria-hidden
    >
      <div className="portrait-void-art__mesh" />
      <div className="portrait-void-art__grid" />

      {ORBS.map((orb, i) => (
        <span
          key={`orb-${i}`}
          className="portrait-void-art__orb"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {tags.map((tag, i) => (
        <span
          key={tag.label}
          className="portrait-void-art__tag"
          style={{
            left: tag.x,
            top: tag.y,
            animationDelay: `${(i % 5) * 0.5}s`,
          }}
        >
          {tag.label}
        </span>
      ))}

      <svg
        className="portrait-void-art__svg"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          className="portrait-void-art__arc"
          d="M20 140 C80 40, 140 20, 200 50 S280 90, 300 60"
          stroke="url(#voidArc1)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          className="portrait-void-art__arc portrait-void-art__arc--delay"
          d="M40 160 C100 80, 180 30, 260 70"
          stroke="url(#voidArc2)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />
        <circle
          className="portrait-void-art__ring"
          cx="160"
          cy="72"
          r="36"
          stroke="url(#voidArc1)"
          strokeWidth="0.75"
          fill="none"
        />
        <defs>
          <linearGradient id="voidArc1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff8c42" stopOpacity="0" />
            <stop offset="40%" stopColor="#ff6b00" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="voidArc2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
