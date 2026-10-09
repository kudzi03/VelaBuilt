/**
 * VELABUILT — canonical entity definition.
 *
 * Everything that describes *who VelaBuilt is* resolves here: metadata,
 * structured data, navigation, footer and on-page copy. One source keeps the
 * entity consistent for people, search engines and answer engines alike.
 */

import { resolveSiteOrigin } from "@/lib/site-origin";

export const site = {
  name: "VelaBuilt",
  legalName: "VelaBuilt",
  /**
   * The canonical origin. next.config.ts resolves it once at build time and
   * inlines it as NEXT_PUBLIC_SITE_URL, so this reads the same value in every
   * bundle. Only that variable is passed through — never `process.env` whole —
   * so the bundler can inline it. See src/lib/site-origin.ts.
   */
  url: resolveSiteOrigin({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }).origin,
  email: "jace@velabuilt.com",

  /**
   * Direct lines — OFF until real values are supplied. `null` renders nothing
   * anywhere: no tel: link in the header or footer, no booking link on /start
   * or in the confirmation, no telephone in structured data. Never fill these
   * with a placeholder; a wrong number is worse than no number. Malformed
   * values fail the build (see assertContact below).
   *
   *   phone       { display: "+44 20 0000 0000", e164: "+442000000000" }
   *   bookingUrl  "https://…" — an external scheduling page, opened in a new tab
   */
  phone: null as { readonly display: string; readonly e164: string } | null,
  bookingUrl: null as string | null,

  locale: "en_US",

  /** One sentence. Used verbatim in schema, meta description and the About page. */
  tagline: "A better website. Better follow-up.",
  shortDescription:
    "VelaBuilt builds websites that help people understand and contact your business, plus tools that help you reply, follow up and keep work organised.",
  longDescription:
    "VelaBuilt builds websites that show what your business does and make it easy to get in touch. We also build tools that answer common questions using your information, help your team follow up, and keep enquiries and work in one place. We fit those tools to the way your business already works.",

  capabilities: ["Websites", "AI Assistants", "Follow-Up", "Business Tools"] as const,

  social: {
    instagram: "https://www.instagram.com/velabuilt",
  },
} as const;

function assertContact(): void {
  if (site.phone && !/^\+[1-9]\d{6,14}$/.test(site.phone.e164)) {
    throw new Error(`site.phone.e164 must be E.164 (e.g. +442000000000), got "${site.phone.e164}"`);
  }
  if (site.bookingUrl && !/^https:\/\/[^\s]+$/.test(site.bookingUrl)) {
    throw new Error(`site.bookingUrl must be an https:// URL, got "${site.bookingUrl}"`);
  }
}
assertContact();

/** Primary navigation. Order is deliberate: understand → see → trust → act. */
export const primaryNav = [
  { label: "What we do", href: "/#capabilities" },
  { label: "Work", href: "/work" },
  { label: "Approach", href: "/approach" },
  { label: "Studio", href: "/about" },
] as const;

export const footerNav = [
  {
    heading: "What we do",
    links: [
      { label: "Websites", href: "/website-conversion-systems" },
      { label: "AI Assistants", href: "/ai-systems" },
      { label: "Follow-Up", href: "/lead-follow-up-systems" },
      { label: "Business Tools", href: "/business-systems" },
      { label: "Get Found Online", href: "/website-engine-optimization" },
    ],
  },
  {
    heading: "Studio",
    links: [
      { label: "Approach", href: "/approach" },
      { label: "About", href: "/about" },
      { label: "Work", href: "/work" },
      { label: "System Lab", href: "/system-lab" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Start a project", href: "/start" },
      { label: site.email, href: `mailto:${site.email}` },
      ...(site.phone ? [{ label: site.phone.display, href: `tel:${site.phone.e164}` }] : []),
      { label: "Instagram", href: site.social.instagram },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
] as const;

/**
 * What VelaBuilt does not claim. Stated plainly on the site and readable by
 * answer engines — the honesty is the positioning.
 */
export const disclosures = [
  "VelaBuilt does not publish client results it cannot evidence.",
  "Work shown as CONCEPT is a study, not a delivered client project.",
  "Work shown as WORKING EXAMPLE uses sample details, not real customer records.",
  "No performance, revenue or ranking guarantees are made anywhere on this site.",
] as const;
