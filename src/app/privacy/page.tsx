import type { Metadata } from "next";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description:
    "What VelaBuilt collects when you send an inquiry, why, how long it is kept, and how to have it removed.",
  path: "/privacy",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Privacy", path: "/privacy" },
];

/**
 * Plain-language privacy statement describing what this site actually does.
 *
 * It is written against the real implementation: one form, one endpoint, no
 * analytics scripts, no third-party embeds, no cookies. If any of that changes,
 * this page changes in the same commit.
 */
const SECTIONS = [
  {
    title: "What this site collects",
    body: [
      "Nothing at all until you send an inquiry. There are no analytics scripts, no advertising pixels, no third-party embeds and no cookies set by this site.",
      "When you complete the Start a Project form we receive what you typed: your name, your email address, optionally your company and website, your answers to the three questions, and anything you wrote in the message field.",
    ],
  },
  {
    title: "Why we hold it",
    body: [
      "To reply to your inquiry and to continue that conversation. It is not used for anything else, and you are not added to a mailing list.",
      "We do not sell, rent or share inquiry details with third parties for their own marketing.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "Inquiries that do not become projects are removed within twelve months. Where a project goes ahead, the correspondence is kept for as long as we work together and for the period afterwards that our records require.",
    ],
  },
  {
    title: "Technical details we do not keep",
    body: [
      "The inquiry endpoint applies a rate limit using a short-lived, in-memory record of the requesting network address. It is not written to a database, not linked to your inquiry, and does not survive a restart.",
      "Inquiry contents are never written to server logs.",
    ],
  },
  {
    title: "Where it goes",
    body: [
      "Inquiries are delivered to VelaBuilt and, where configured, to the systems we use to manage our own pipeline. Those systems are the ones described on this site — a record of the inquiry, and a reminder to follow it up.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You can ask what we hold about you, ask for it to be corrected, or ask for it to be deleted. Write to the address below and we will action it.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <section className="relative pb-24 pt-[calc(var(--nav-height)+5rem)]">
        <div className="shell-narrow">
          <Breadcrumbs crumbs={crumbs} />

          <Label tone="champagne" className="mt-10">
            Privacy
          </Label>
          <h1 className="display-lg mt-5">What we collect, and why.</h1>
          <p className="lede mt-8">
            Short, because this site does very little with your data.
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
