"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { portraitStackTags } from "@/lib/content";

type PortraitVoidArtProps = {
  variant?: "desktop" | "mobile";
};

const ORBS = [
  { x: "18%", y: "22%", size: 6, delay: 0 },
  { x: "72%", y: "14%", size: 4, delay: 0.4 },
  { x: "48%", y: "32%", size: 8, delay: 0.8 },
  { x: "85%", y: "28%", size: 5, delay: 1.2 },
  { x: "32%", y: "8%", size: 3, delay: 0.6 },
  { x: "58%", y: "18%", size: 5, delay: 1.5 },
] as const;

export function PortraitVoidArt({ variant = "desktop" }: PortraitVoidArtProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tags = portraitStackTags;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const arcs = root.querySelectorAll<SVGPathElement>("[data-void-arc]");
    const orbs = root.querySelectorAll<HTMLElement>("[data-void-orb]");
    const tagEls = root.querySelectorAll<HTMLElement>("[data-void-tag]");

    const ctx = gsap.context(() => {
      arcs.forEach((path, i) => {
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 0.5,
        });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 2.2,
          delay: i * 0.35,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
          repeatDelay: 1.5,
        });
      });

      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          y: `+=${variant === "mobile" ? 10 : 14}`,
          x: `+=${i % 2 === 0 ? 6 : -6}`,
          duration: 2.8 + i * 0.25,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: ORBS[i]?.delay ?? 0,
        });
      });

      tagEls.forEach((tag, i) => {
        gsap.to(tag, {
          y: `+=${i % 2 === 0 ? 8 : -8}`,
          x: `+=${i % 3 === 0 ? 5 : -5}`,
          duration: 3.2 + (i % 4) * 0.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.15,
        });
      });
    }, root);

    return () => ctx.revert();
  }, [variant]);

  return (
    <div
      ref={rootRef}
      className={`portrait-void-art portrait-void-art--${variant}`}
      aria-hidden
    >
      <div className="portrait-void-art__mesh" />
      <div className="portrait-void-art__grid" />

      {ORBS.map((orb, i) => (
        <span
          key={`orb-${i}`}
          data-void-orb
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
          data-void-tag
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
          data-void-arc
          d="M20 140 C80 40, 140 20, 200 50 S280 90, 300 60"
          stroke="url(#voidArc1)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          data-void-arc
          d="M40 160 C100 80, 180 30, 260 70"
          stroke="url(#voidArc2)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
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
            <stop offset="40%" stopColor="#ff6b00" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="voidArc2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
