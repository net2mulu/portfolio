import { site, about } from "@/lib/content";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        description: siteDescription,
        inLanguage: "en",
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: site.name,
        url: siteUrl,
        email: site.email,
        jobTitle: site.title,
        description: about.paragraphs[0],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Addis Ababa",
        },
        sameAs: [site.linkedin, site.github],
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#business`,
        name: `${site.name} — Digital Solutions`,
        url: siteUrl,
        description: site.tagline,
        areaServed: "Worldwide",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
