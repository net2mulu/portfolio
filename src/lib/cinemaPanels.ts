const PANEL_COUNT = 3;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function updateCinemaPanels(
  panels: HTMLElement[],
  progress: number,
  isMobile: boolean,
  setPanel: (
    panel: HTMLElement,
    values: {
      opacity: number;
      y: number;
      scale: number;
      visibility: string;
      pointerEvents: string;
    },
  ) => void,
) {
  const p = Math.max(0, Math.min(1, progress));
  const slot = p * PANEL_COUNT;
  const current = Math.min(PANEL_COUNT - 1, Math.floor(slot));
  const blend = slot - Math.floor(slot);

  const fadeStart = isMobile ? 0.32 : 0.72;
  const fadeEnd = 1;

  panels.forEach((panel, i) => {
    let opacity = 0;
    let y = 0;
    let scale = isMobile ? 0.98 : 0.94;

    if (i === current) {
      opacity = 1;
      scale = 1;
      if (blend > fadeStart && i < panels.length - 1) {
        const t = smoothstep(fadeStart, fadeEnd, blend);
        opacity = 1 - t;
        y = isMobile ? -10 * t : -14 * t;
        scale = 1 - t * 0.025;
      }
    } else if (i === current + 1 && blend > fadeStart) {
      const t = smoothstep(fadeStart, fadeEnd, blend);
      opacity = t;
      y = isMobile ? 12 * (1 - t) : 18 * (1 - t);
      scale = 0.98 + t * 0.02;
    } else if (i < current) {
      opacity = 0;
    }

    if (p <= 0.001 && i === 0) {
      opacity = 1;
      y = 0;
      scale = 1;
    }

    if (p >= 0.998 && i === panels.length - 1) {
      opacity = 1;
      y = 0;
      scale = 1;
    }

    setPanel(panel, {
      opacity,
      y,
      scale,
      visibility: opacity > 0.015 ? "visible" : "hidden",
      pointerEvents: opacity > 0.45 ? "auto" : "none",
    });
  });
}
