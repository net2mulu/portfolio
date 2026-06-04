"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ParallaxDecor() {
  const wave1 = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (wave1.current) {
        gsap.to(wave1.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.55,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden lg:z-[38]" aria-hidden>
      <div className="decor-ambient decor-ambient--nav" />
      <div className="decor-ambient decor-ambient--top hidden lg:block" />

      <svg
        ref={wave1}
        className="absolute left-[-2%] top-[30%] w-[48%] max-w-lg opacity-40"
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
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
