"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PortraitVoidArt } from "@/components/PortraitVoidArt";
import { FRAME_COUNT } from "@/lib/frames";
import {
  getPortraitFrameCache,
  preloadPortraitFrames,
} from "@/lib/portraitFrameCache";

type PortraitFrameProps = {
  progressRef: React.MutableRefObject<number>;
  className?: string;
  variant?: "desktop" | "mobile";
};

type Layout = { dx: number; dy: number; dw: number; dh: number };

const BG = "#0a0a0a";

type FitOptions = {
  scale: number;
  anchor: "center" | "bottom";
};

const FIT: Record<"desktop" | "mobile", FitOptions> = {
  desktop: { scale: 1.26, anchor: "bottom" },
  mobile: { scale: 1.28, anchor: "bottom" },
};

const MAX_DPR: Record<"desktop" | "mobile", number> = {
  desktop: 1.25,
  mobile: 1,
};

/** Mobile: light blend between frames, capped draw rate */
const MOBILE_RENDER_INTERVAL_MS = 20;

function getLayout(
  img: HTMLImageElement,
  cw: number,
  ch: number,
  options: FitOptions,
  cache: Map<string, Layout>,
): Layout | null {
  if (!img.naturalWidth) return null;
  const key = `${img.src}-${cw}-${ch}-${options.scale}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const fit =
    Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * options.scale;
  const layout = {
    dx: (cw - img.naturalWidth * fit) / 2,
    dy:
      options.anchor === "bottom"
        ? ch - img.naturalHeight * fit - ch * 0.035
        : (ch - img.naturalHeight * fit) / 2,
    dw: img.naturalWidth * fit,
    dh: img.naturalHeight * fit,
  };
  cache.set(key, layout);
  return layout;
}

function drawImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  layout: Layout | null,
) {
  if (!img?.complete || !layout) return;
  ctx.drawImage(img, layout.dx, layout.dy, layout.dw, layout.dh);
}

export function PortraitFrame({
  progressRef,
  className = "",
  variant = "desktop",
}: PortraitFrameProps) {
  const fitOptions = FIT[variant];
  const opaqueCanvas = variant === "mobile";
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<HTMLImageElement[]>([]);
  const layoutCacheRef = useRef(new Map<string, Layout>());
  const sizeRef = useRef({ cw: 0, ch: 0, dpr: 1 });
  const lastDrawRef = useRef({ p: -1, i0: -1, i1: -1, blend: -1 });
  const [ready, setReady] = useState(false);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      MAX_DPR[variant],
    );
    const rect = canvas.getBoundingClientRect();
    const cw = Math.floor(rect.width * dpr);
    const ch = Math.floor(rect.height * dpr);

    if (cw < 1 || ch < 1) return false;

    if (
      sizeRef.current.cw !== cw ||
      sizeRef.current.ch !== ch ||
      sizeRef.current.dpr !== dpr
    ) {
      canvas.width = cw;
      canvas.height = ch;
      sizeRef.current = { cw, ch, dpr };
      layoutCacheRef.current.clear();
      lastDrawRef.current = { p: -1, i0: -1, i1: -1, blend: -1 };
    }
    return true;
  }, [variant]);

  const render = useCallback(
    (p: number, options: FitOptions, fillOpaque: boolean) => {
      const canvas = canvasRef.current;
      const cache = cacheRef.current;
      if (!canvas || cache.length === 0 || !syncCanvasSize()) return;

      const { cw, ch } = sizeRef.current;
      const isMobile = variant === "mobile";
      const exact = p * (FRAME_COUNT - 1);
      const i0 = Math.floor(exact);
      const i1 = Math.min(FRAME_COUNT - 1, i0 + 1);
      let blend = exact - i0;

      const blendSoft = isMobile ? 0.22 : 0.12;
      const blendHard = isMobile ? 0.78 : 0.88;
      if (blend < blendSoft) blend = 0;
      else if (blend > blendHard) blend = 1;
      else blend = (blend - blendSoft) / (blendHard - blendSoft);

      const last = lastDrawRef.current;
      const progressEpsilon = isMobile ? 0.005 : 0.02;
      if (
        last.p === p &&
        last.i0 === i0 &&
        last.i1 === i1 &&
        Math.abs(blend - last.blend) < progressEpsilon
      ) {
        return;
      }
      lastDrawRef.current = { p, i0, i1, blend };

      const ctx = canvas.getContext("2d", {
        alpha: !fillOpaque,
        desynchronized: true,
      } as CanvasRenderingContext2DSettings);
      if (!ctx) return;

      const layoutMap = layoutCacheRef.current;
      const img0 = cache[i0];
      const img1 = cache[i1];
      const l0 = img0 ? getLayout(img0, cw, ch, options, layoutMap) : null;
      const l1 = img1 ? getLayout(img1, cw, ch, options, layoutMap) : null;

      if (fillOpaque) {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, cw, ch);
      } else {
        ctx.clearRect(0, 0, cw, ch);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";

      if (blend <= 0) {
        drawImage(ctx, img0, l0);
      } else if (blend >= 1) {
        drawImage(ctx, img1, l1);
      } else {
        drawImage(ctx, img0, l0);
        ctx.globalAlpha = blend;
        drawImage(ctx, img1, l1);
        ctx.globalAlpha = 1;
      }
    },
    [syncCanvasSize, variant],
  );

  useEffect(() => {
    let cancelled = false;

    const applyCache = (cache: HTMLImageElement[]) => {
      if (cancelled) return;
      cacheRef.current = cache;
      setReady(true);
      render(progressRef.current, fitOptions, opaqueCanvas);
    };

    const existing = getPortraitFrameCache();
    if (existing?.length) {
      applyCache(existing);
      return;
    }

    void preloadPortraitFrames().then((cache) => applyCache(cache));
    return () => {
      cancelled = true;
    };
  }, [render, progressRef, fitOptions, opaqueCanvas]);

  useEffect(() => {
    if (!ready) return;

    let lastP = -1;
    let lastRenderAt = 0;
    const isMobile = variant === "mobile";

    const tick = (now: number) => {
      if (document.hidden) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const p = progressRef.current;
      if (p === lastP) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      if (
        isMobile &&
        now - lastRenderAt < MOBILE_RENDER_INTERVAL_MS &&
        Math.abs(p - lastP) < 0.004
      ) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      lastP = p;
      lastRenderAt = now;
      render(p, fitOptions, opaqueCanvas);
      frameId = requestAnimationFrame(tick);
    };

    const onResize = () => {
      syncCanvasSize();
      lastDrawRef.current = { p: -1, i0: -1, i1: -1, blend: -1 };
      render(progressRef.current, fitOptions, opaqueCanvas);
    };

    window.addEventListener("resize", onResize, { passive: true });

    const ro =
      wrapRef.current &&
      new ResizeObserver(() => {
        syncCanvasSize();
        lastDrawRef.current = { p: -1, i0: -1, i1: -1, blend: -1 };
        render(progressRef.current, fitOptions, opaqueCanvas);
      });
    if (ro && wrapRef.current) ro.observe(wrapRef.current);

    let frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [ready, render, progressRef, fitOptions, opaqueCanvas, syncCanvasSize, variant]);

  return (
    <div
      ref={wrapRef}
      className={`portrait-cinema ${variant === "mobile" ? "portrait-cinema--mobile" : ""} ${className}`}
    >
      <div
        className="portrait-cinema__viewport"
        aria-label="Portrait animation of Natnael Mulugeta"
        role="img"
      >
        {!ready && (
          <div className="portrait-cinema__loader">
            <span className="portrait-cinema__loader-dot" />
          </div>
        )}
        <canvas ref={canvasRef} className="portrait-cinema__canvas" />
        <PortraitVoidArt variant={variant} />
        <div className="portrait-cinema__vignette" aria-hidden />
        <div className="portrait-cinema__fade portrait-cinema__fade--left" aria-hidden />
        <div className="portrait-cinema__fade portrait-cinema__fade--right" aria-hidden />
        <div className="portrait-cinema__fade portrait-cinema__fade--bottom" aria-hidden />
        {variant === "mobile" && (
          <div className="portrait-cinema__fade portrait-cinema__fade--top" aria-hidden />
        )}
      </div>
    </div>
  );
}
