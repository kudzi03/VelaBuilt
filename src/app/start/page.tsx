import type { Metadata } from "next";
import { FOCUS_OPTIONS, focusIntro, type Focus } from "@/content/enquiry-flow";
import { site } from "@/content/site";
import { formIssuedAt } from "@/lib/enquiry/form";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { BookingLink, PhoneLink } from "@/components/chrome/ContactLinks";
import { EnquiryConfirmation } from "@/components/enquiry/EnquiryConfirmation";
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

/** Shape of `createReference()` in src/lib/enquiry/adapter.ts. */
const REFERENCE_PATTERN = /^VB-\d{4}-[0-9A-Z]{6}$/;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * The enquiry as a real, linkable page.
 *
 * The header's button normally opens this in a dialog, but the route exists in
 * its own right: it can be linked to, opened in a new tab, indexed, and
 * submitted without JavaScript. `?focus=` pre-answers the first question when
 * a visitor arrives from a specific solution. `?sent=<reference>` is where a
 * native (no-JS) submission lands after the server accepts it.
 */
export default async function StartPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = first(params.focus);
  const focus = FOCUS_OPTIONS.includes(raw as Focus) ? (raw as Focus) : undefined;
  const sentParam = first(params.sent);
  const sentReference =
    sentParam && REFERENCE_PATTERN.test(sentParam) ? sentParam : null;
  // Rendered per request (searchParams), so this is the time this visitor
  // received the form — the no-JS path's equivalent of the client's timer.
  const renderedAt = formIssuedAt();

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
                {(focus && focusIntro[focus]) ?? (
                  <>
                    Four short questions. A person reads every one of them, and replies
                    with an honest assessment — including when we are not the right
                    people for it.
                  </>
                )}
              </p>

              <div className="mt-10 border-t border-[color:var(--color-hairline)] pt-8">
                <Label>Prefer email?</Label>
                <a
                  href={`mailto:${site.email}`}
                  className="mt-3 inline-block text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-champagne)]"
                >
                  {site.email}
                </a>
                <PhoneLink className="mt-3 block text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4 transition-colors hover:decoration-[color:var(--color-champagne)]" />
              </div>

              {site.bookingUrl ? (
                <div className="mt-8 border-t border-[color:var(--color-hairline)] pt-8">
                  <BookingLink className="btn btn-ghost" />
                </div>
              ) : null}
            </div>

            <div className="panel min-h-[34rem]">
              {sentReference ? (
                <EnquiryConfirmation reference={sentReference} headingId="start-question" />
              ) : (
                <EnquiryFlow
                  initialFocus={focus}
                  variant="page"
                  headingId="start-question"
                  renderedAt={renderedAt}
                />
              )}
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
