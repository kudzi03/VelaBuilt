/**
 * STRUCTURED DATA.
 *
 * Rules held here deliberately:
 *   · Only types that describe something genuinely on the page.
 *   · FAQPage only for FAQs rendered visibly to a human.
 *   · No AggregateRating, no Review, no invented awards or counts.
 *   · One consistent Organization `@id` across every page, so the entity
 *     resolves to a single subject rather than several near-duplicates.
 */

import { site } from "@/content/site";
import type { Service } from "@/content/services";
import type { FaqEntry } from "@/content/faq";
import { absoluteUrl, type Crumb } from "./seo";

export const ORGANIZATION_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    description: site.shortDescription,
    slogan: site.tagline,
    email: site.email,
    ...(site.phone ? { telephone: site.phone.e164 } : {}),
    sameAs: [site.social.instagram],
    knowsAbout: [
      "Web design",
      "Conversion optimisation",
      "Business process automation",
      "Customer relationship management",
      "Applied AI systems",
      "Technical SEO",
      "Structured data",
    ],
  };
}

export function webSiteSchema(): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: site.url,
    name: site.name,
    description: site.shortDescription,
    inLanguage: "en-GB",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function serviceSchema(service: Service): Json {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(`/${service.slug}`)}#service`,
    name: service.name,
    serviceType: service.name,
    description: service.summary,
    provider: { "@id": ORGANIZATION_ID },
    audience: {
      "@type": "BusinessAudience",
      audienceType: service.audience,
    },
    url: absoluteUrl(`/${service.slug}`),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${service.name} — capabilities`,
      itemListElement: service.capabilities.map((capability) => ({
        "@type": "OfferCatalog",
        name: capability,
      })),
    },
  };
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Only ever called with FAQs that are rendered visibly on the same page. */
export function faqSchema(entries: readonly FaqEntry[]): Json | null {
  if (entries.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Wraps nodes into a single @graph — one script tag per page. */
export function graph(nodes: readonly (Json | null)[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is Json => node !== null),
  });
}
