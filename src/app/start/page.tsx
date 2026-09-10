import type { Metadata } from "next";
import { FOCUS_OPTIONS, type Focus } from "@/content/enquiry-flow";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { EnquiryFlow } from "@/components/enquiry/EnquiryFlow";
import { PageBackdrop } from "@/components/cinematic/PageBackdrop";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: "Start a project",
  description:
    "Tell us what you are trying to improve — website, follow-up, automation, AI or discoverability — and we will reply with an honest assessment.",
  path: "/start",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Start a project", path: "/start" },
];

/**
 * The enquiry as a real, linkable page.
 *
 * The header's button normally opens this in a dialog, but the route exists in
 * its own right: it can be linked to, opened in a new tab, indexed, and
 * reached when JavaScript fails. `?focus=` pre-answers the first question when
 * a visitor arrives from a specific solution.
 */
export default async function StartPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  const focus = FOCUS_OPTIONS.includes(raw as Focus) ? (raw as Focus) : undefined;

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden pb-20 pt-[calc(var(--nav-height)+3.5rem)]">
        <PageBackdrop plate="gateway" focal={[0.5, 0.46]} presence={0.34} />

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-20">
            <div>
              <Label tone="champagne">Start a project</Label>
              <h1 className="display-lg mt-6 max-w-[14ch]">
                Tell us what is <span className="foil">not working.</span>
              </h1>
              <p className="lede mt-8 max-w-[40ch]">
                Four short questions. A person reads every one of them, and replies
                with an honest assessment — including when we are not the right
                people for it.
              </p>

              <div className="mt-10 border-t border-[color:var(--color-hairline)] pt-8">
                <Label>Prefer email?</Label>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-3 inline-block text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-champagne)]"
                >
                  {site.email}
                </a>
              </div>

              <noscript>
                <p className="mt-8 max-w-[44ch] border border-[color:var(--color-hairline-strong)] p-4 text-sm text-[color:var(--color-ivory-dim)]">
                  This form needs JavaScript to send. Email {site.email} with what
                  you are trying to improve and we will pick it up from there.
                </p>
              </noscript>
            </div>

            <div className="panel min-h-[34rem]">
              <EnquiryFlow initialFocus={focus} variant="page" headingId="start-question" />
            </div>
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
