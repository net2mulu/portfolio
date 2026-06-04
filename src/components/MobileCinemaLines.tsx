"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setupNeonScrollLines } from "@/lib/neonLines";

gsap.registerPlugin(ScrollTrigger);

export function MobileCinemaLines() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const mm = gsap.matchMedia();
    mm.add("(max-width: 1023px)", () => {
      const ctx = gsap.context(() => {
        setupNeonScrollLines(svg, "[data-mline]", "mNeonBlur", "+=90%");
      }, svg);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <svg
      ref={ref}
      className="mobile-cinema-lines pointer-events-none absolute inset-0 z-[8] h-full w-full lg:hidden"
      viewBox="0 0 390 700"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <defs>
        <filter
          id="mNeonGlow"
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur id="mNeonBlur" stdDeviation="3" result="blur" />
          <feFlood floodColor="#ff5500" floodOpacity="0.95" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feGaussianBlur in="glow" stdDeviation="2" result="glow2" />
          <feMerge>
            <feMergeNode in="glow2" />
            <feMergeNode in="glow2" />
            <feMergeNode in="glow" />
          </feMerge>
        </filter>
        <linearGradient id="mLineV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb347" stopOpacity="0" />
          <stop offset="25%" stopColor="#ff6b00" stopOpacity="1" />
          <stop offset="75%" stopColor="#ff4500" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mLineV2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8c42" stopOpacity="0" />
          <stop offset="50%" stopColor="#ff6b00" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff8c42" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mLineCurve" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd699" stopOpacity="0.3" />
          <stop offset="40%" stopColor="#ff6b00" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff3300" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      <path
        data-glow="v1"
        d="M30 0 V700"
        stroke="url(#mLineV)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#mNeonGlow)"
        opacity="0.7"
      />
      <path
        data-mline
        data-glow-id="v1"
        d="M30 0 V700"
        stroke="url(#mLineV)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      <path
        data-glow="v2"
        d="M360 0 V700"
        stroke="url(#mLineV2)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#mNeonGlow)"
        opacity="0.55"
      />
      <path
        data-mline
        data-glow-id="v2"
        d="M360 0 V700"
        stroke="url(#mLineV2)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      <path
        data-glow="c1"
        d="M0 120 C120 200, 80 400, 200 580"
        stroke="url(#mLineCurve)"
        strokeWidth="6"
        strokeLinecap="round"
        filter="url(#mNeonGlow)"
        opacity="0.65"
      />
      <path
        data-mline
        data-glow-id="c1"
        d="M0 120 C120 200, 80 400, 200 580"
        stroke="url(#mLineCurve)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
