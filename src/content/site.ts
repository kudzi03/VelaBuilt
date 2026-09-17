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
  tagline: "Systems for what’s next.",
  shortDescription:
    "VelaBuilt is a creative technology studio building premium websites, follow-up systems and intelligent digital infrastructure for modern businesses.",
  longDescription:
    "VelaBuilt is a creative technology studio. We build three things: websites that make a business easier to trust and contact, follow-up systems that stop good inquiries going cold, and the technical foundations that make a business easier for people, search engines and AI systems to find and understand. We design the experience and we build the infrastructure underneath it.",

  capabilities: ["Websites", "Automation", "AI Systems"] as const,

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
  { label: "Solutions", href: "/#solutions" },
  { label: "System Lab", href: "/system-lab" },
  { label: "Work", href: "/work" },
  { label: "Approach", href: "/approach" },
  { label: "About", href: "/about" },
] as const;

export const footerNav = [
  {
    heading: "Solutions",
    links: [
      { label: "Website Conversion System", href: "/website-conversion-systems" },
      { label: "Lead Follow-Up & Recovery", href: "/lead-follow-up-systems" },
      { label: "Website Engine Optimization", href: "/website-engine-optimization" },
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
  "Work shown as SYSTEM DEMO uses sample data, not real customer records.",
  "No performance, revenue or ranking guarantees are made anywhere on this site.",
] as const;
