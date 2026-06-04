"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { PortraitVoidArt } from "@/components/PortraitVoidArt";
import { FRAME_COUNT, framePath } from "@/lib/frames";

type PortraitFrameProps = {
  progressRef: React.MutableRefObject<number>;
  className?: string;
  variant?: "desktop" | "mobile";
};

type Layout = { dx: number; dy: number; dw: number; dh: number };

const BG = "#0a0a0a";

type FitOptions = {
  /** Multiplier on contain-fit size; >1 fills more of the frame */
  scale: number;
  anchor: "center" | "bottom";
};

const FIT: Record<"desktop" | "mobile", FitOptions> = {
  desktop: { scale: 1.26, anchor: "bottom" },
  mobile: { scale: 1.28, anchor: "bottom" },
};

function getLayout(
  img: HTMLImageElement,
  cw: number,
  ch: number,
  options: FitOptions,
): Layout | null {
  if (!img.naturalWidth) return null;
  const fit =
    Math.min(cw / img.naturalWidth, ch / img.naturalHeight) * options.scale;
  const dw = img.naturalWidth * fit;
  const dh = img.naturalHeight * fit;
  const dx = (cw - dw) / 2;
  const dy =
    options.anchor === "bottom"
      ? ch - dh - ch * 0.035
      : (ch - dh) / 2;
  return { dx, dy, dw, dh };
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<HTMLImageElement[]>([]);
  const layoutRef = useRef<{ cw: number; ch: number }>({ cw: 0, ch: 0 });
  const [ready, setReady] = useState(false);

  const opaqueCanvas = variant === "mobile";

  const render = useCallback(
    (p: number, options: FitOptions, fillOpaque: boolean) => {
    const canvas = canvasRef.current;
    const cache = cacheRef.current;
    if (!canvas || cache.length === 0) return;

    const ctx = canvas.getContext("2d", { alpha: !fillOpaque });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const cw = Math.floor(rect.width * dpr);
    const ch = Math.floor(rect.height * dpr);

    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
      layoutRef.current = { cw, ch };
    }

    const exact = p * (FRAME_COUNT - 1);
    const i0 = Math.floor(exact);
    const i1 = Math.min(FRAME_COUNT - 1, i0 + 1);
    let blend = exact - i0;

    // Tighter crossfade — avoids long double-exposure that causes light flicker
    if (blend < 0.08) blend = 0;
    else if (blend > 0.92) blend = 1;
    else blend = (blend - 0.08) / 0.84;

    const img0 = cache[i0];
    const img1 = cache[i1];
    const l0 = img0 ? getLayout(img0, cw, ch, options) : null;
    const l1 = img1 ? getLayout(img1, cw, ch, options) : null;

    if (fillOpaque) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, cw, ch);
    } else {
      ctx.clearRect(0, 0, cw, ch);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

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
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const cache: HTMLImageElement[] = new Array(FRAME_COUNT);

    const preload = async () => {
      for (let start = 0; start < FRAME_COUNT; start += 12) {
        if (cancelled) return;
        await Promise.all(
          Array.from({ length: Math.min(12, FRAME_COUNT - start) }, (_, j) => {
            const i = start + j;
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.src = framePath(i);
              img.onload = () => {
                cache[i] = img;
                resolve();
              };
              img.onerror = () => resolve();
            });
          }),
        );
        if (start === 0) {
          cacheRef.current = cache;
          setReady(true);
          render(progressRef.current, fitOptions, opaqueCanvas);
        }
      }
      cacheRef.current = cache;
      setReady(true);
      render(progressRef.current, fitOptions, opaqueCanvas);
    };

    void preload();
    return () => {
      cancelled = true;
    };
  }, [render, progressRef, variant, fitOptions, opaqueCanvas]);

  useEffect(() => {
    if (!ready) return;

    const tick = () => render(progressRef.current, fitOptions, opaqueCanvas);
    gsap.ticker.add(tick);

    const onResize = () =>
      render(progressRef.current, fitOptions, opaqueCanvas);
    window.addEventListener("resize", onResize);

    const ro =
      wrapRef.current &&
      new ResizeObserver(() =>
        render(progressRef.current, fitOptions, opaqueCanvas),
      );
    if (ro && wrapRef.current) ro.observe(wrapRef.current);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [ready, render, progressRef, fitOptions, opaqueCanvas]);

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
