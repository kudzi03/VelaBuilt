import type { Metadata } from "next";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description:
    "This site sets no cookies, stores nothing in your browser and loads no tracking scripts. How visits are still counted, and exactly what is sent.",
  path: "/cookies",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Cookies", path: "/cookies" },
];

/**
 * The cookie statement.
 *
 * Measured against the running site: no cookies, no localStorage, no
 * sessionStorage, no third-party scripts. Analytics is first-party: pages
 * beacon to /api/track, which forwards to GA4 server-side
 * (src/lib/analytics.ts).
 *
 * If anything else is added — an embedded map, a booking widget, a chat
 * bubble — this page changes in the same commit, and anything that stores
 * something in the browser asks first.
 */
const SECTIONS = [
  {
    title: "This site sets no cookies",
    body: [
      "None. Not for analytics, not for advertising, not for preferences, and not for measuring you across other sites.",
      "It also stores nothing in your browser by any other route — no localStorage, no sessionStorage, no local database. Close the tab and your browser holds nothing this site put there.",
    ],
  },
  {
    title: "We do measure visits — without storing anything",
    body: [
      "The site uses Google Analytics 4 to count visits, see which pages people read, where they came from, and which buttons lead to an enquiry. That is how we know whether the site is doing its job.",
      "Your browser never talks to Google for this. Pages send a short note to this site’s own server — which page, which button — and the server passes it on to Google Analytics. Your network address is not passed on; only the country and region it indicates.",
      "Nothing is stored in your browser to do this. Each visit gets a random identifier that exists only in the open tab and is gone when you close it, so we cannot recognise you on a later visit.",
      "No name, email address or anything you type into the enquiry form is ever sent to Google Analytics.",
    ],
  },
  {
    title: "Why there is no cookie banner",
    body: [
      "A consent banner exists to ask permission to store things in your browser that are not strictly necessary. This site stores nothing there, so there is nothing to consent to and nothing to refuse.",
      "If you would rather not be counted at all, blocking requests to /api/track with a content blocker stops it; the site works the same without it.",
    ],
  },
  {
    title: "Nothing is loaded from anyone else",
    body: [
      "Only one, and only if you choose it: talking to Vela connects you to the voice service that runs her, described on the privacy page. Fonts, images and scripts are served from this domain. There are no tag managers, advertising pixels, embeds or social widgets.",
    ],
  },
  {
    title: "What happens when you send an inquiry",
    body: [
      "The form posts to this site’s own endpoint. What you typed is described in full on the privacy page, along with how long it is kept and how to have it removed.",
      "The endpoint holds a short-lived, in-memory record of the requesting network address to rate-limit abuse. It is not a cookie, it is not stored in your browser, it is not linked to your inquiry, and it does not survive a restart.",
    ],
  },
  {
    title: "Check it yourself",
    body: [
      "Open your browser’s developer tools on any page of this site and look under Application, then Cookies and Storage. The lists are empty. We would rather you verified this than took our word for it.",
    ],
  },
  {
    title: "If this changes",
    body: [
      "Adding anything that stores something in your browser — an embedded video, a scheduling widget — would make this page wrong. So it is updated in the same change that introduces it, and anything non-essential would ask you first.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <>
      <section data-chapter="reading" className="sheet mt-[calc(var(--nav-height)+1.5rem)] pb-24 pt-16">
        <div className="shell-narrow">
          <Breadcrumbs crumbs={crumbs} />

          <Label className="mt-10">
            Cookies
          </Label>
          <h1 className="display-lg mt-5">
            There are none.
          </h1>
          <p className="lede mt-8">
            Shorter than most, because there is very little to declare.
          </p>

          <div className="mt-16 flex flex-col gap-12">
            {SECTIONS.map((section) => (
              <section key={section.title} aria-labelledby={slug(section.title)}>
                <h2 id={slug(section.title)} className="display-sm">
                  {section.title}
                </h2>
                <div className="prose-vb mt-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section aria-labelledby="contact-heading">
              <h2 id="contact-heading" className="display-sm">
                Contact
              </h2>
              <p className="prose-vb mt-4">
                <a
                  href={`mailto:${site.email}`}
                  className="text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4"
                >
                  {site.email}
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: graph([breadcrumbSchema(crumbs)]) }}
      />
    </>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
