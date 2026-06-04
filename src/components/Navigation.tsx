"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/content";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Navigation() {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [pastHero, setPastHero] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const cinema = document.getElementById("scroll-cinema");
      if (!cinema) {
        setPastHero(window.scrollY > 48);
        setInHero(true);
        return;
      }

      const rect = cinema.getBoundingClientRect();
      const heroStillVisible = rect.bottom > 72;
      const heroCoversTop = rect.top < window.innerHeight * 0.55;

      setInHero(heroStillVisible && heroCoversTop);
      setPastHero(rect.bottom <= 72);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!isMobile || !menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen, isMobile]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const headerClass = isMobile
    ? pastHero
      ? "nav-mobile-solid"
      : "nav-mobile-hero"
    : pastHero
      ? "nav-desktop-scrolled"
      : inHero
        ? "nav-desktop-hero"
        : "nav-desktop-clear";

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`nav-header fixed top-0 right-0 left-0 z-40 transition-[background,box-shadow,padding] duration-300 ${headerClass} ${pastHero ? "py-3" : "py-5"}`}
    >
      <nav className="site-container flex items-center justify-between">
        <div className="relative">
          <a
            href="#"
            className={`nav-logo-mark nav-logo${menuOpen && isMobile ? " nav-logo-mark--open" : ""}`}
            aria-expanded={isMobile ? menuOpen : undefined}
            aria-controls={isMobile ? "mobile-nav-menu" : undefined}
            aria-label={
              isMobile ? (menuOpen ? "Close menu" : "Open menu") : "Natnael Mulugeta home"
            }
            onClick={(e) => {
              if (!isMobile) return;
              e.preventDefault();
              setMenuOpen((open) => !open);
            }}
          >
            <span className="nav-logo-mark__text">NM</span>
          </a>

          <AnimatePresence>
            {menuOpen && isMobile && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="nav-mobile-menu-backdrop fixed inset-0 z-[35] bg-black/40 lg:hidden"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.ul
                  id="mobile-nav-menu"
                  role="menu"
                  className="nav-mobile-menu z-[41] lg:hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
