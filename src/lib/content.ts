export const site = {
  name: "Natnael Mulugeta",
  headline: "I build scalable digital systems for businesses, institutions, and growing ideas.",
  title: "Full-Stack Developer, Digital Solutions Architect & Technology Consultant",
  tagline:
    "I design and build scalable digital platforms, business systems, and cloud-based solutions for companies, institutions, and high-impact projects.",
  email: "hello@natnael.dev",
  linkedin: "https://linkedin.com",
  github: "https://github.com",
  location: "Addis Ababa / Remote available",
};

/** Floating stack labels in portrait hero void area */
export const portraitStackTags = [
  { label: "React", x: "5%", y: "8%" },
  { label: "Next.js", x: "55%", y: "4%" },
  { label: "Node", x: "76%", y: "16%" },
  { label: "TypeScript", x: "3%", y: "26%" },
  { label: "NestJS", x: "36%", y: "12%" },
  { label: "PostgreSQL", x: "68%", y: "30%" },
  { label: "Prisma", x: "20%", y: "4%" },
  { label: "AWS", x: "86%", y: "6%" },
  { label: "Docker", x: "48%", y: "24%" },
  { label: "Tailwind", x: "10%", y: "34%" },
  { label: "GraphQL", x: "62%", y: "20%" },
  { label: "Python", x: "40%", y: "2%" },
] as const;

export const about = {
  paragraphs: [
    "I am a full-stack developer and digital solutions architect with experience in building modern web applications, SaaS platforms, business systems, cloud infrastructure, and digital transformation solutions.",
    "My work combines software engineering, system architecture, and practical business understanding to help organizations move from manual processes to reliable, scalable digital platforms.",
    "I focus on building solutions that are clean, secure, user-friendly, and ready to grow.",
  ],
};

export const services = [
  {
    title: "Full-Stack Web Development",
    description:
      "Building modern applications using Next.js, React, NestJS, Node.js, TypeScript, Prisma, and PostgreSQL.",
  },
  {
    title: "Business Platforms & SaaS Systems",
    description:
      "Designing dashboards, admin panels, CRM systems, booking platforms, membership systems, LMS platforms, and internal tools.",
  },
  {
    title: "Cloud & DevOps",
    description:
      "Deploying and managing applications using Docker, VPS servers, Nginx Proxy Manager, Cloudflare, CI/CD, and self-hosted infrastructure.",
  },
  {
    title: "System Architecture",
    description:
      "Planning scalable, modular, and secure systems with clean backend structure, role-based access, APIs, and database design.",
  },
  {
    title: "Digital Transformation Consulting",
    description:
      "Helping businesses and organizations turn real operational problems into practical digital solutions.",
  },
];

export const projects = [
  {
    title: "Signature Fitness Platform",
    description:
      "A gym and studio management platform with memberships, payments, attendance tracking, QR validation, renewals, and admin dashboards.",
    tags: ["SaaS", "Payments", "Admin"],
  },
  {
    title: "AYZON Care",
    description:
      "A chronic disease monitoring platform concept with patient app, doctor dashboard, alerts, subscriptions, and care workflow management.",
    tags: ["HealthTech", "Dashboards", "Alerts"],
  },
  {
    title: "Church Management System",
    description:
      "A multi-role church management platform for membership tracking, classes, attendance, consultations, and administrative workflows.",
    tags: ["Multi-role", "Workflows", "CRM"],
  },
  {
    title: "Education Platform",
    description:
      "An exam preparation and learning platform with diagnostics, daily practice, student progress tracking, and adaptive learning workflows.",
    tags: ["LMS", "Analytics", "Adaptive"],
  },
  {
    title: "Business Listing Platform",
    description:
      "A local business discovery platform designed to help businesses improve visibility and connect with customers.",
    tags: ["Marketplace", "Discovery", "SEO"],
  },
];

export const philosophy =
  "I believe technology should solve real problems, not just look modern. My approach starts with understanding the workflow, users, and data structure before designing the system. Then I build clean, secure, and scalable solutions that support long-term growth.";

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Contact", href: "#contact" },
];
