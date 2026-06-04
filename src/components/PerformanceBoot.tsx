"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function PerformanceBoot() {
  useEffect(() => {
    gsap.config({ autoSleep: 60, force3D: true });
    ScrollTrigger.config({ limitCallbacks: true });
  }, []);

  return null;
}
