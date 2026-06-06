"use client";

import { motion } from "framer-motion";
import { portraitStackTags, site } from "@/lib/content";
import type { PreloadProgress } from "@/lib/portraitFrameCache";

const ORBIT_LABELS = [
  "React",
  "React Native",
  "Flutter",
  "AWS",
  "Docker",
  "Kubernetes",
  "Next.js",
  "Expo",
  "NestJS",
  "PostgreSQL",
  "Prisma",
  "GraphQL",
] as const;

const ORBIT_TAGS = ORBIT_LABELS.map((label) =>
  portraitStackTags.find((tag) => tag.label === label),
).filter((tag): tag is (typeof portraitStackTags)[number] => tag != null);

type AppBootLoaderProps = {
  progress: PreloadProgress;
  statusLine: string;
};

export function AppBootLoader({ progress, statusLine }: AppBootLoaderProps) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (progress.pct / 100) * c;

  return (
    <motion.div
      className="app-boot"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading portfolio, ${progress.pct} percent`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="app-boot__grid" aria-hidden />
      <div className="app-boot__scan" aria-hidden />

      <div className="app-boot__orbit" aria-hidden>
        {ORBIT_TAGS.map((tag, i) => (
          <span
            key={tag.label}
            className="app-boot__chip"
            style={
              {
                "--i": i,
                "--n": ORBIT_TAGS.length,
              } as React.CSSProperties
            }
          >
            {tag.label}
          </span>
        ))}
      </div>

      <div className="app-boot__core">
        <div className="app-boot__ring-wrap">
          <svg className="app-boot__ring" viewBox="0 0 120 120" aria-hidden>
            <circle
              className="app-boot__ring-track"
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="3"
            />
            <circle
              className="app-boot__ring-progress"
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="3"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="app-boot__monogram">
            <span className="app-boot__monogram-text">NM</span>
          </div>
        </div>

        <motion.p
          className="app-boot__name font-display"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          {site.name}
        </motion.p>
        <p className="app-boot__role">{site.title}</p>
      </div>

      <div className="app-boot__terminal">
        <p className="app-boot__terminal-prompt">
          <span className="app-boot__terminal-user">natnael@portfolio</span>
          <span className="app-boot__terminal-sep">:</span>
          <span className="app-boot__terminal-path">~/scroll-cinema</span>
          <span className="app-boot__terminal-cursor">$</span>
        </p>
        <p className="app-boot__terminal-line">
          <span className="text-accent">&gt;</span> {statusLine}
          <span className="app-boot__terminal-blink" aria-hidden />
        </p>
        <div className="app-boot__bar" aria-hidden>
          <div
            className="app-boot__bar-fill"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="app-boot__meta font-mono">
          FRAME_BUFFER [{String(progress.loaded).padStart(2, "0")}/
          {progress.total}] · {progress.pct}%
        </p>
      </div>
    </motion.div>
  );
}
