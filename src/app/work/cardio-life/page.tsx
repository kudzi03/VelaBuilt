import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowRight, CategoryBadge, Label } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "Cardio Life — corporate training, Botswana",
  description:
    "A clearer digital presence for an accredited workplace training provider: positioning, information architecture and a direct path from training requirement to quotation.",
  path: "/work/cardio-life",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Work", path: "/work" },
  { name: "Cardio Life", path: "/work/cardio-life" },
];

const LIVE_URL = "https://www.cardiolife.co.bw/";

const SERVICES = [
  "Website strategy",
  "Positioning",
  "Information architecture",
  "UX/UI",
  "Development",
  "Mobile experience",
  "Quotation journey",
] as const;

/**
 * Case study: shown, not argued.
 *
 * Six sections, each one short. No revenue, conversion, lead or ranking
 * figures appear anywhere — none were measured, and a case study that invents
 * them is the thing this site exists not to be.
 */
export default function CardioLifePage() {
  return (
    <>

      {/* 1 — Hero */}
      <section data-chapter="page-project" className="page-hero">

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <CategoryBadge tone="champagne">Client Work</CategoryBadge>
            <h1 className="display-xl mt-6 max-w-[12ch]">
              Cardio Life.
            </h1>
            <p className="label mt-5">Corporate training · Botswana</p>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[46ch]">
              A clearer digital presence for an accredited workplace training
              provider.
            </p>

            <a
              href={LIVE_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-primary mt-9"
            >
              <span className="inline-flex items-center gap-3">
                View live site
                <ArrowRight />
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">

      {/* The delivered site, at the top, because it is the evidence. */}
      <section aria-label="The delivered website" className="relative pb-6">
        <div className="shell">
          <Reveal>
            <figure className="panel overflow-hidden !border-0">
              <picture>
                <source type="image/avif" srcSet="/work/cardio-life/desktop.avif" />
                <source type="image/webp" srcSet="/work/cardio-life/desktop.webp" />
                <img
                  src="/work/cardio-life/desktop.webp"
                  alt="The Cardio Life home page: a headline reading “The training your company is required to run — from a provider you can verify”, over a photograph of a first aid session, beside a panel listing the provider’s BQA accreditation record."
                  width={1600}
                  height={1000}
                  className="block h-auto w-full"
                />
              </picture>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* 2 — The business */}
      <section aria-labelledby="business-heading" className="relative py-16">
        <div className="shell">
          <Reveal className="reading-ground">
            <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
              <div>
                <Label>01</Label>
                <h2 id="business-heading" className="display-md mt-4 max-w-[12ch]">
                  The business
                </h2>
              </div>
              <div className="prose-vb max-w-[58ch]">
                <p>
                  Cardio Life provides accredited first aid, fire fighting and
                  occupational health &amp; safety training to organizations
                  across Botswana.
                </p>
                <p>
                  The training is accredited by the Botswana Qualifications
                  Authority and approved by HRDC, and it is delivered at the
                  client&rsquo;s premises as readily as at the provider&rsquo;s own.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 — The challenge */}
      <section aria-labelledby="challenge-heading" className="relative py-16">
        <div className="shell">
          <Reveal className="reading-ground">
            <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
              <div>
                <Label>02</Label>
                <h2 id="challenge-heading" className="display-md mt-4 max-w-[12ch]">
                  The challenge
                </h2>
              </div>
              <div className="max-w-[58ch]">
                <p className="prose-vb">
                  Workplace training is bought by people who have to justify the
                  choice: HR, procurement and safety officers. Three things stand
                  between a requirement and a purchase order.
                </p>
                <ul className="mt-8 flex flex-col gap-4">
                  {[
                    "Understanding which courses exist, and which of them the organization is actually required to run.",
                    "Verifying that the provider is genuinely accredited, rather than taking the claim at face value.",
                    "Reaching a quotation without an exchange of emails to establish the basics.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex gap-4 text-sm leading-relaxed text-[color:var(--color-ivory-dim)]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-px w-4 shrink-0 bg-[color:var(--color-champagne-deep)]"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4 — What we built */}
      <section aria-labelledby="built-heading" className="relative py-16">
        <div className="shell">
          <Reveal className="reading-ground">
            <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
              <div>
                <Label>03</Label>
                <h2 id="built-heading" className="display-md mt-4 max-w-[12ch]">
                  What we built
                </h2>
              </div>
              <div className="max-w-[58ch]">
                <p className="prose-vb">
                  The site was designed around helping HR, procurement and safety
                  teams understand the available training, verify the provider and
                  move quickly toward requesting a quotation.
                </p>

                <div className="mt-9">
                  <Label>Services</Label>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {SERVICES.map((service) => (
                      <li
                        key={service}
                        className="border border-[color:var(--color-hairline)] px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-faint)]"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-12">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <figure className="panel overflow-hidden !border-0">
                <picture>
                  <source type="image/avif" srcSet="/work/cardio-life/detail.avif" />
                  <source type="image/webp" srcSet="/work/cardio-life/detail.webp" />
                  <img
                    src="/work/cardio-life/detail.webp"
                    alt="A section of the Cardio Life site listing the HRDC-approved courses available to quote for a team."
                    width={1600}
                    height={1000}
                    loading="lazy"
                    className="block h-auto w-full"
                  />
                </picture>
              </figure>

              <figure className="panel flex items-center justify-center overflow-hidden !border-0 p-8">
                <picture>
                  <source type="image/avif" srcSet="/work/cardio-life/mobile.avif" />
                  <source type="image/webp" srcSet="/work/cardio-life/mobile.webp" />
                  <img
                    src="/work/cardio-life/mobile.webp"
                    alt="The Cardio Life home page on a phone, with the accreditation record and the quotation request reachable without pinching or zooming."
                    width={780}
                    height={1328}
                    loading="lazy"
                    className="block h-auto w-full max-w-[19rem]"
                  />
                </picture>
              </figure>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5 — Outcome */}
      <section aria-labelledby="outcome-heading" className="relative py-16">
        <div className="shell">
          <Reveal className="reading-ground">
            <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
              <div>
                <Label>04</Label>
                <h2 id="outcome-heading" className="display-md mt-4 max-w-[12ch]">
                  Outcome
                </h2>
              </div>
              <div className="max-w-[58ch]">
                <p className="lede text-[color:var(--color-ivory)]">
                  A focused commercial website that presents Cardio Life&rsquo;s
                  training and accreditation clearly and gives prospective clients
                  a direct path from training requirement to inquiry.
                </p>
                <p className="prose-vb mt-6 text-sm">
                  No performance, ranking or lead figures are published here.
                  Nothing was measured that would support them, and this site does
                  not publish results it cannot evidence.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6 — Live-site CTA */}
      <section aria-labelledby="live-heading" className="relative py-16 pb-28">
        <div className="shell">
          <Reveal className="reading-ground">
            <h2 id="live-heading" className="display-md max-w-[16ch]">
              The site is live. Go and use it.
            </h2>
            <p className="prose-vb mt-5 max-w-[52ch]">
              The quickest way to judge this work is the same way its visitors do
              — on a phone, looking for a course and a quotation.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-6">
              <a
                href={LIVE_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary"
              >
                <span className="inline-flex items-center gap-3">
                  View live site
                  <ArrowRight />
                </span>
              </a>
              <Link href="/work" className="btn btn-ghost">
                <span className="inline-flex items-center gap-3">
                  All work
                  <ArrowRight />
                </span>
              </Link>
            </div>

            {/* Stated plainly rather than quietly absorbed into the studio record. */}
            <p className="mt-12 border-t border-[color:var(--color-hairline)] pt-8 text-sm leading-relaxed text-[color:var(--color-muted)]">
              Cardio Life was delivered by VelaBuilt&rsquo;s founder before the
              current studio identity existed. It is published here as client
              work because it was delivered for a client; the studio name it was
              delivered under was simply a different one.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-14">
            <StartProjectLink variant="primary" focus="website">
              Start a project
            </StartProjectLink>
          </Reveal>
        </div>
      </section>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: graph([
            breadcrumbSchema(crumbs),
            {
              "@type": "CreativeWork",
              name: "Cardio Life",
              about:
                "A commercial website for an accredited first aid, fire fighting and occupational health and safety training provider in Botswana.",
              url: LIVE_URL,
            },
          ]),
        }}
      />
    </>
  );
}
