import type { Metadata } from "next";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description:
    "This site sets no cookies and loads nothing from third parties. What that means, and what would have to change for it to stop being true.",
  path: "/cookies",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Cookies", path: "/cookies" },
];

/**
 * The cookie statement.
 *
 * Every claim on this page was measured against the running site, not assumed
 * from the source: no cookies, no localStorage, no sessionStorage, no
 * third-party scripts, no iframes, and every network request same-origin.
 *
 * If any of that stops being true — an analytics script, an embedded map, a
 * booking widget, a chat bubble — this page changes in the same commit that
 * introduces it, and a consent mechanism arrives with it. A page that says
 * "no cookies" while the site sets them is worse than no page at all.
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
    title: "Why there is no cookie banner",
    body: [
      "A consent banner exists to ask permission for storage that is not strictly necessary. This site asks for no such storage, so there is nothing to consent to and nothing to refuse.",
      "You are not being tracked into agreeing to anything, and dismissing a banner is not the price of reading the page.",
    ],
  },
  {
    title: "Nothing is loaded from anyone else",
    body: [
      "The fonts, images and scripts are served from this domain. There are no third-party embeds, no tag managers, no advertising pixels and no social widgets, so no other company is told that you visited.",
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
      "Open your browser’s developer tools on any page of this site and look under Application, then Cookies. The list is empty. We would rather you verified this than took our word for it.",
    ],
  },
  {
    title: "If this changes",
    body: [
      "Adding anything that sets a cookie — an analytics tool, an embedded video, a scheduling widget — would make this page wrong. So it is updated in the same change that introduces it, and anything non-essential would ask you first.",
    ],
  },
] as const;

export default function CookiesPage() {
  return (
    <>
      <section className="relative pb-24 pt-[calc(var(--nav-height)+5rem)]">
        <div className="shell-narrow">
          <Breadcrumbs crumbs={crumbs} />

          <Label tone="champagne" className="mt-10">
            Cookies
          </Label>
          <h1 className="display-lg mt-5">
            There are <span className="foil">none.</span>
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
