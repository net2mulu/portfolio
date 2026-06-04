/** Canonical site URL — set NEXT_PUBLIC_SITE_URL in production */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://natnael.dev";

export const siteName = "Natnael Mulugeta";

export const siteTitle =
  "Natnael Mulugeta | Full-Stack Developer & Digital Solutions Architect";

export const siteDescription =
  "Full-stack developer and digital solutions architect building scalable web applications, SaaS platforms, business systems, and cloud infrastructure for companies and institutions.";

/** Social preview / Open Graph portrait (place file at public/assets/me.png) */
export const siteOgImagePath = "/assets/me.png";
export const siteOgImageAlt =
  "Natnael Mulugeta — Full-Stack Developer and Digital Solutions Architect";
