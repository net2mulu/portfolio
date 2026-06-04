"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setupNeonScrollLines } from "@/lib/neonLines";

gsap.registerPlugin(ScrollTrigger);

export function CinemaLines() {
  const rootRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = rootRef.current;
    if (!svg) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const ctx = gsap.context(() => {
        setupNeonScrollLines(svg, "[data-line]", "dNeonBlur", "+=70%", {
          travelingPulse: true,
        });
      }, svg);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <svg
      ref={rootRef}
      className="cinema-lines cinema-lines--behind pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <defs>
        <filter
          id="dNeonGlow"
          x="-80%"
          y="-80%"
          width="260%"
          height="260%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur id="dNeonBlur" stdDeviation="3" result="blur" />
          <feFlood floodColor="#ff5500" floodOpacity="0.95" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feGaussianBlur in="glow" stdDeviation="2" result="glow2" />
          <feMerge>
            <feMergeNode in="glow2" />
            <feMergeNode in="glow2" />
            <feMergeNode in="glow" />
          </feMerge>
        </filter>
        <linearGradient id="lineH1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff8c42" stopOpacity="0" />
          <stop offset="18%" stopColor="#ff6b00" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffd699" stopOpacity="1" />
          <stop offset="82%" stopColor="#ff6b00" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff8c42" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineH2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Upper band — behind head / shoulders */}
      <path
        data-glow="h1"
        d="M-40 155 C180 115, 380 195, 520 140 S820 170, 1040 150"
        stroke="url(#lineH1)"
        strokeWidth="5"
        strokeLinecap="round"
        filter="url(#dNeonGlow)"
        opacity="0.6"
      />
      <path
        data-line
        data-glow-id="h1"
        d="M-40 155 C180 115, 380 195, 520 140 S820 170, 1040 150"
        stroke="url(#lineH1)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Mid horizontal — full width */}
      <path
        data-glow="h2"
        d="M-60 248 H1060"
        stroke="url(#lineH2)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#dNeonGlow)"
        opacity="0.5"
      />
      <path
        data-line
        data-glow-id="h2"
        d="M-60 248 H1060"
        stroke="url(#lineH2)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Lower sweep */}
      <path
        data-glow="h3"
        d="M-40 330 C220 295, 420 365, 620 310 S880 350, 1040 325"
        stroke="url(#lineH1)"
        strokeWidth="4.5"
        strokeLinecap="round"
        filter="url(#dNeonGlow)"
        opacity="0.55"
      />
      <path
        data-line
        data-glow-id="h3"
        d="M-40 330 C220 295, 420 365, 620 310 S880 350, 1040 325"
        stroke="url(#lineH1)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Secondary upper arc */}
      <path
        data-glow="h4"
        d="M0 200 C250 175, 500 225, 750 185 S950 210, 1000 198"
        stroke="url(#lineH2)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#dNeonGlow)"
        opacity="0.4"
      />
      <path
        data-line
        data-glow-id="h4"
        d="M0 200 C250 175, 500 225, 750 185 S950 210, 1000 198"
        stroke="url(#lineH2)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
