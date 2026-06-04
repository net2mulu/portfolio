"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinemaLines } from "@/components/CinemaLines";
import { MobileCinemaLines } from "@/components/MobileCinemaLines";
import { PortraitFrame } from "@/components/PortraitFrame";
import { about, site } from "@/lib/content";
import { bindMobileScrollProxy } from "@/lib/mobileScrollProxy";

gsap.registerPlugin(ScrollTrigger);

const PANEL_COUNT = 3;

function PanelContent({ index }: { index: 0 | 1 | 2 }) {
  if (index === 0) {
    return (
      <>
        <p className="text-xs font-medium tracking-[0.35em] text-accent uppercase">
          Portfolio
        </p>
        <h1 className="font-display text-[clamp(2rem,9vw,2.75rem)] leading-[0.92] font-bold tracking-tight lg:text-[clamp(2.75rem,11vw,4rem)]">
          <span className="block text-outline">HELLO</span>
          <span className="block">
            I&apos;m{" "}
            <span className="relative inline-block">
              {site.name.split(" ")[0]}
              <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-accent" />
            </span>
          </span>
        </h1>
        <p className="text-base font-medium leading-snug text-foreground/90">
          {site.title}
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted lg:line-clamp-none">
          {site.tagline}
        </p>
        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
          <a href="#projects" className="btn-primary">
            View My Work
          </a>
          <a href="#contact" className="btn-ghost">
            Contact Me
          </a>
        </div>
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <p className="text-xs tracking-[0.3em] text-accent uppercase">About</p>
        <h2 className="font-display text-3xl font-bold leading-tight">
          Building systems that <span className="text-accent">scale</span>
        </h2>
        <p className="text-base leading-relaxed text-muted">{about.paragraphs[0]}</p>
      </>
    );
  }
  return (
    <>
      <p className="text-xs tracking-[0.3em] text-accent uppercase">Approach</p>
      <p className="border-l-2 border-accent/60 pl-4 text-lg leading-relaxed italic text-foreground/90">
        &ldquo;{site.headline}&rdquo;
      </p>
      <p className="text-base leading-relaxed text-muted">{about.paragraphs[1]}</p>
    </>
  );
}

export function ScrollCinema() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mobileRoot = root.querySelector<HTMLElement>("[data-cinema-mobile]");
    const desktopRoot = root.querySelector<HTMLElement>("[data-cinema-desktop]");
    const mobilePanels = mobileRoot
      ? gsap.utils.toArray<HTMLElement>("[data-cinema-panel]", mobileRoot)
      : [];
    const desktopPanels = desktopRoot
      ? gsap.utils.toArray<HTMLElement>("[data-cinema-panel]", desktopRoot)
      : [];
    const portraitWrapDesktop = desktopRoot?.querySelector<HTMLElement>(
      "[data-portrait-wrap]",
    );
    const portraitWrapMobile = mobileRoot?.querySelector<HTMLElement>(
      "[data-portrait-wrap]",
    );
    const portraitMobile = mobileRoot?.querySelector<HTMLElement>(
      "[data-portrait-mobile]",
    );

    const ctx = gsap.context(() => {
      const initPanels = (panels: HTMLElement[]) => {
        panels.forEach((panel, i) => {
          gsap.set(panel, {
            opacity: i === 0 ? 1 : 0,
            y: 0,
            scale: 1,
            visibility: i === 0 ? "visible" : "hidden",
          });
        });
      };

      initPanels(mobilePanels);
      initPanels(desktopPanels);

      const applyProgress = (progress: number, isMobile: boolean) => {
        progressRef.current = progress;
        const panels = isMobile ? mobilePanels : desktopPanels;
        updatePanels(panels, progress, isMobile);

        const portraitWrap = isMobile ? portraitWrapMobile : portraitWrapDesktop;
        if (portraitWrap) {
          const fade = Math.min(1, Math.max(0, (progress - 0.88) / 0.1));
          gsap.set(portraitWrap, { opacity: 1 - fade });
        }
        if (portraitMobile && isMobile) {
          gsap.set(portraitMobile, { scale: 1, y: 0 });
        }
      };

      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": () => {
          applyProgress(0, false);
          ScrollTrigger.create({
            trigger: root,
            start: "top top",
            end: "+=200%",
            scrub: 0.35,
            pin: "#cinema-pin",
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => applyProgress(self.progress, false),
          });
        },

        "(max-width: 1023px)": () => {
          applyProgress(0, true);
          const st = ScrollTrigger.create({
            trigger: root,
            start: "top top",
            end: "+=200%",
            scrub: 0.4,
            pin: "#cinema-pin",
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => applyProgress(self.progress, true),
          });

          const pinEl = root.querySelector<HTMLElement>("#cinema-pin");
          const unbindScroll = pinEl ? bindMobileScrollProxy(pinEl) : undefined;

          return () => {
            unbindScroll?.();
            st.kill();
          };
        },
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="scroll-cinema" ref={rootRef} className="relative" aria-label="Introduction">
      <div id="cinema-pin" className="cinema-pin relative min-h-[100dvh] overflow-hidden">
        <MobileCinemaLines />

        {/* ——— Mobile layout ——— */}
        <div
          data-cinema-mobile
          className="cinema-mobile relative flex h-[100dvh] min-h-0 flex-col touch-pan-y lg:hidden"
        >
          <div className="site-container shrink-0 pt-[4.25rem] pb-2">
            <div
              data-portrait-mobile
              data-portrait-wrap
              className="relative h-[min(38vh,320px)] overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_48px_-16px_rgba(249,115,22,0.3)]"
            >
              <PortraitFrame progressRef={progressRef} variant="mobile" className="h-full" />
            </div>
          </div>

          <div className="site-container cinema-mobile__copy min-h-0 flex-1 overflow-visible pb-5">
            <div className="cinema-mobile__panels relative min-h-[11rem] flex-1">
              {[0, 1, 2].map((i) => (
                <article
                  key={i}
                  data-cinema-panel
                  data-panel-index={i}
                  className={`cinema-panel cinema-panel--mobile absolute inset-0 flex flex-col justify-start gap-2.5 overflow-visible py-0.5 ${i === 0 ? "cinema-panel--active" : ""}`}
                >
                  <PanelContent index={i as 0 | 1 | 2} />
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ——— Desktop layout ——— */}
        <div
          data-cinema-desktop
          className="site-container relative hidden h-[100dvh] pt-[5.5rem] lg:block"
        >
          <div className="relative h-[calc(100dvh-5.5rem)]">
          <div className="relative z-30 flex h-full flex-col justify-center lg:max-w-[44%] lg:pr-8">
            <div className="relative min-h-[360px]">
              {[0, 1, 2].map((i) => (
                <article
                  key={i}
                  data-cinema-panel
                  data-panel-index={i}
                  className={`cinema-panel absolute inset-0 flex flex-col justify-center gap-5 ${i === 0 ? "cinema-panel--active" : ""}`}
                >
                  <PanelContent index={i as 0 | 1 | 2} />
                </article>
              ))}
            </div>
          </div>

          <div
            data-portrait-wrap
            className="pointer-events-none absolute top-0 right-0 bottom-0 left-[34%] z-[12] lg:left-[38%]"
          >
            <div className="absolute inset-0 z-0 hidden overflow-hidden lg:block">
              <CinemaLines />
            </div>
            <div className="relative z-[1] h-full">
              <PortraitFrame progressRef={progressRef} className="h-full" />
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function updatePanels(
  panels: HTMLElement[],
  progress: number,
  isMobile: boolean,
) {
  const p = Math.max(0, Math.min(0.9999, progress));
  const slot = p * PANEL_COUNT;
  const current = Math.floor(slot);
  const blend = slot - current;

  panels.forEach((panel, i) => {
    let opacity = 0;
    let y = 0;
    let scale = 0.94;

    if (i === current) {
      opacity = 1;
      scale = 1;
      if (blend > 0.72 && i < panels.length - 1) {
        const out = (blend - 0.72) / 0.28;
        opacity = 1 - out;
        y = isMobile ? -20 * out : -14 * out;
        scale = 1 - out * 0.04;
      }
    } else if (i === current + 1 && blend > 0.72) {
      const inn = (blend - 0.72) / 0.28;
      opacity = inn;
      y = isMobile ? 28 * (1 - inn) : 18 * (1 - inn);
      scale = 0.94 + inn * 0.06;
    }

    if (progress <= 0.001 && i === 0) {
      opacity = 1;
      y = 0;
      scale = 1;
    }

    if (progress >= 0.92 && i === panels.length - 1) {
      opacity = 1;
      y = 0;
      scale = 1;
    }

    gsap.set(panel, {
      opacity,
      y,
      scale,
      visibility: opacity > 0.02 ? "visible" : "hidden",
      pointerEvents: opacity > 0.5 ? "auto" : "none",
    });
  });
}
