"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AppBootLoader } from "@/components/AppBootLoader";
import { PerformanceBoot } from "@/components/PerformanceBoot";
import { ScrollCinema } from "@/components/ScrollCinema";
import { Navigation } from "@/components/Navigation";
import { ParallaxDecor } from "@/components/ParallaxDecor";
import { Reveal } from "@/components/Reveal";
import { usePortraitPreload } from "@/hooks/usePortraitPreload";
import {
  about,
  philosophy,
  projects,
  services,
  site,
} from "@/lib/content";

const BOOT_IN_PROD = process.env.NODE_ENV === "production";

export function Portfolio() {
  const { ready, progress, statusLine } = usePortraitPreload(BOOT_IN_PROD);

  return (
    <>
      <AnimatePresence mode="wait">
        {BOOT_IN_PROD && !ready && (
          <AppBootLoader
            key="boot"
            progress={progress}
            statusLine={statusLine}
          />
        )}
      </AnimatePresence>

      {(!BOOT_IN_PROD || ready) && (
        <>
      <PerformanceBoot />
      <ParallaxDecor />
      <Navigation />

      <main className="relative z-[8]">
        <ScrollCinema />

        {/* About — continues story after cinema */}
        <section id="about" className="section-pad -mt-2 border-t border-white/5">
          <div className="site-container">
            <Reveal>
              <span className="text-xs tracking-[0.3em] text-accent uppercase">
                About
              </span>
              <h2 className="font-display mt-3 text-4xl font-bold text-foreground md:text-5xl">
                Ready to <span className="text-accent">grow</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-10 max-w-3xl text-base leading-relaxed text-muted md:text-lg">
                {about.paragraphs[2]}
              </p>
            </Reveal>
          </div>
        </section>

        <section id="services" className="section-pad bg-surface/50">
          <div className="site-container">
            <Reveal>
              <span className="text-xs tracking-[0.3em] text-accent uppercase">
                What I Do
              </span>
              <h2 className="font-display mt-3 text-4xl font-bold md:text-5xl">
                Services & expertise
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08}>
                  <motion.article
                    whileHover={{ y: -6 }}
                    className="group h-full rounded-2xl border border-white/8 bg-[#111]/80 p-6 backdrop-blur-sm transition hover:border-accent/30"
                  >
                    <div className="mb-4 h-px w-12 bg-accent transition-all group-hover:w-20" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {s.description}
                    </p>
                  </motion.article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="section-pad">
          <div className="site-container">
            <Reveal>
              <span className="text-xs tracking-[0.3em] text-accent uppercase">
                Featured Projects
              </span>
              <h2 className="font-display mt-3 text-4xl font-bold md:text-5xl">
                Selected work
              </h2>
            </Reveal>
            <div className="mt-14 flex flex-col gap-8">
              {projects.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.06}>
                  <article className="group grid gap-6 border-b border-white/8 pb-10 md:grid-cols-[1fr_2fr] md:items-start">
                    <div>
                      <span className="font-mono text-xs text-accent/80">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-2 font-display text-2xl font-bold transition group-hover:text-accent md:text-3xl">
                        {p.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-base leading-relaxed text-muted md:pt-6">
                      {p.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="philosophy" className="section-pad bg-surface/50">
          <div className="site-container text-center">
            <Reveal>
              <span className="text-xs tracking-[0.3em] text-accent uppercase">
                Personal Philosophy
              </span>
              <blockquote className="font-display mx-auto mt-8 max-w-4xl text-2xl leading-snug font-medium text-foreground md:text-3xl lg:text-4xl">
                &ldquo;{philosophy}&rdquo;
              </blockquote>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="section-pad border-t border-white/5">
          <div className="site-container">
            <Reveal>
              <h2 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
                Let&apos;s build something{" "}
                <span className="text-accent">practical</span> and scalable
              </h2>
              <p className="mt-6 max-w-xl text-lg text-muted">
                Have a project, platform, or system idea? I can help you plan,
                design, build, and deploy it.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <li>
                  <span className="text-xs tracking-widest text-muted uppercase">
                    Email
                  </span>
                  <a
                    href={`mailto:${site.email}`}
                    className="mt-2 block text-foreground transition hover:text-accent"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <span className="text-xs tracking-widest text-muted uppercase">
                    LinkedIn
                  </span>
                  <a
                    href={site.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-foreground transition hover:text-accent"
                  >
                    Connect
                  </a>
                </li>
                <li>
                  <span className="text-xs tracking-widest text-muted uppercase">
                    GitHub
                  </span>
                  <a
                    href={site.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-foreground transition hover:text-accent"
                  >
                    View repos
                  </a>
                </li>
                <li>
                  <span className="text-xs tracking-widest text-muted uppercase">
                    Location
                  </span>
                  <p className="mt-2 text-foreground">{site.location}</p>
                </li>
              </ul>
            </Reveal>
          </div>
        </section>

        <footer className="border-t border-white/5 py-8 text-center text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {site.name}. Crafted with Next.js,
            GSAP & Framer Motion.
          </p>
        </footer>
      </main>
        </>
      )}
    </>
  );
}
