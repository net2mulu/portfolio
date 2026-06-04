"use client";

import { useEffect, useState } from "react";
import { FRAME_COUNT } from "@/lib/frames";
import {
  preloadPortraitFrames,
  subscribePreloadProgress,
  type PreloadProgress,
} from "@/lib/portraitFrameCache";

const STATUS_LINES = [
  "initializing scroll-cinema",
  "decoding portrait frame buffer",
  "hydrating React · Next.js runtime",
  "mounting TypeScript asset graph",
  "streaming transparent WebP sequence",
  "syncing GSAP scroll timeline",
  "ready — Natnael Mulugeta online",
] as const;

function statusForProgress(pct: number): string {
  if (pct >= 100) return STATUS_LINES[6];
  if (pct >= 85) return STATUS_LINES[5];
  if (pct >= 65) return STATUS_LINES[4];
  if (pct >= 45) return STATUS_LINES[3];
  if (pct >= 25) return STATUS_LINES[2];
  if (pct >= 8) return STATUS_LINES[1];
  return STATUS_LINES[0];
}

export function usePortraitPreload(enabled: boolean) {
  const [progress, setProgress] = useState<PreloadProgress>({
    loaded: 0,
    total: FRAME_COUNT,
    pct: 0,
  });
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const unsub = subscribePreloadProgress(setProgress);
    let cancelled = false;

    preloadPortraitFrames().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      unsub();
      document.body.style.overflow = prev;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return;
    document.body.style.overflow = "";
  }, [enabled, ready]);

  return {
    ready,
    progress,
    statusLine: statusForProgress(progress.pct),
  };
}
