"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/content";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48);
      const cinema = document.getElementById("scroll-cinema");
      if (cinema) {
        const rect = cinema.getBoundingClientRect();
        setInHero(rect.bottom > 80 && rect.top < window.innerHeight * 0.5);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`nav-header fixed top-0 right-0 left-0 z-40 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-[#0a0a0a]/75 py-3 backdrop-blur-xl lg:border-white/[0.06] lg:bg-[#0a0a0a]/15 lg:backdrop-blur-md"
          : inHero
            ? "bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent py-5 lg:border-transparent lg:bg-transparent lg:backdrop-blur-none"
            : "bg-transparent py-5 lg:backdrop-blur-none"
      } ${scrolled ? "py-3 lg:py-4" : "py-5"}`}
    >
      <nav className="site-container flex items-center justify-between">
        <div className="relative">
          <button
            type="button"
            className="font-display cursor-pointer text-sm font-bold tracking-[0.2em] text-foreground uppercase lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            NM
          </button>
          <a
            href="#"
            className="nav-logo font-display hidden text-sm font-bold tracking-[0.2em] text-foreground uppercase lg:inline-block md:text-base"
          >
            NM
          </a>

          <AnimatePresence>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-[35] bg-black/25 lg:hidden"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.ul
                  id="mobile-nav-menu"
                  role="menu"
                  className="absolute top-full left-0 z-[41] mt-2 min-w-[180px] rounded-xl border border-white/10 bg-[#111] p-3 shadow-xl lg:hidden"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  {navLinks.map((link) => (
                    <li key={link.href} role="none">
                      <a
                        role="menuitem"
                        href={link.href}
                        className="block rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        <ul className="nav-links hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="nav-link text-sm text-muted transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="nav-cta rounded-full border border-accent/50 bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition hover:bg-accent hover:text-[#0a0a0a] md:text-sm lg:bg-accent/15 lg:backdrop-blur-sm"
        >
          Contact
        </a>
      </nav>
    </motion.header>
  );
}
