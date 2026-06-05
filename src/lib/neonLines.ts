import gsap from "gsap";

type NeonPathPair = {
  core: SVGPathElement;
  glow: SVGPathElement | null;
};

type NeonLinesOptions = {
  /** After draw-in, animate a traveling highlight along the path */
  travelingPulse?: boolean;
  scrub?: number | boolean;
};

export function setupNeonScrollLines(
  svg: SVGSVGElement,
  pathSelector: string,
  blurId: string,
  scrollEnd = "+=85%",
  options: NeonLinesOptions = {},
) {
  const { travelingPulse = true, scrub = 0.45 } = options;
  const cores = gsap.utils.toArray<SVGPathElement>(pathSelector, svg);
  const pairs: NeonPathPair[] = cores.map((core) => ({
    core,
    glow: core.dataset.glowId
      ? (svg.querySelector(
          `[data-glow="${core.dataset.glowId}"]`,
        ) as SVGPathElement | null)
      : null,
  }));

  const blur = svg.querySelector(`#${blurId}`);
  if (blur) {
    gsap.fromTo(
      blur,
      { attr: { stdDeviation: 1.5 } },
      {
        attr: { stdDeviation: 7 },
        ease: "none",
        scrollTrigger: {
          trigger: "#scroll-cinema",
          start: "top top",
          end: scrollEnd,
          scrub,
        },
      },
    );
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#scroll-cinema",
      start: "top top",
      end: scrollEnd,
      scrub,
    },
  });

  pairs.forEach(({ core, glow }, i) => {
    const len = core.getTotalLength();
    const targets = glow ? [core, glow] : [core];
    const seg = 0.08;
    const segLen = len * seg;
    const gapLen = len * (1 - seg);

    gsap.set(targets, {
      strokeDasharray: `${len} ${len}`,
      strokeDashoffset: len,
      opacity: 0,
    });

    const start = i * 0.1;
    const drawDur = 0.14;

    tl.to(
      targets,
      {
        strokeDashoffset: 0,
        opacity: 1,
        duration: drawDur,
        ease: "power2.out",
      },
      start,
    );

    if (travelingPulse) {
      tl.to(
        targets,
        {
          strokeDasharray: `${segLen} ${gapLen}`,
          strokeDashoffset: -len,
          duration: 0.22,
          ease: "none",
        },
        start + drawDur,
      );
    }

    if (glow) {
      tl.to(
        glow,
        {
          opacity: 0.75,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        start + drawDur * 0.5,
      );
    }
  });
}
