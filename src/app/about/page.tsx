import type { Metadata } from "next";
import Link from "next/link";
import { disclosures, site } from "@/content/site";
import { services } from "@/content/services";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: site.longDescription,
  path: "/about",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

/**
 * The entity page.
 *
 * Written answer-first and kept factually identical to the Organization
 * structured data, so a person, a crawler and a language model all come away
 * describing VelaBuilt the same way.
 */
export default function AboutPage() {
  return (
    <>

      <section data-chapter="page-studio" className="page-hero">

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <Label>About</Label>
            <h1 className="display-xl mt-6 max-w-[16ch]">
              A creative technology studio.
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[58ch]">{site.longDescription}</p>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">

      <section aria-labelledby="what-heading" className="relative py-24 lg:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <Reveal>
            <Label>What we build</Label>
            <h2 id="what-heading" className="display-md mt-5 max-w-[18ch]">
              Four areas, one system.
            </h2>
            <p className="mt-8 max-w-[42ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              The website brings the enquiry in; the agents, automation and systems
              behind it make sure it is answered, followed up and recorded.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <ul className="border-t border-[color:var(--color-hairline)]">
              {services.map((service) => (
                <li key={service.slug} className="border-b border-[color:var(--color-hairline)]">
                  <Link href={`/${service.slug}`} className="group block py-7">
                    <div className="flex items-start justify-between gap-8">
                      <div>
                        <h3 className="display-sm transition-colors duration-500 group-hover:underline underline-offset-4">
                          {service.name}
                        </h3>
                        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                          {service.summary}
                        </p>
                      </div>
                      <ArrowRight className="mt-3 shrink-0 transition-transform duration-500 group-hover:translate-x-1.5" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Answer-first block: the questions an AI assistant will be asked. */}
      <section aria-labelledby="facts-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label>In plain terms</Label>
            <h2 id="facts-heading" className="display-lg mt-5 max-w-[18ch]">
              The short version.
            </h2>
          </Reveal>

          <dl className="mt-14 grid gap-3 md:grid-cols-2">
            {[
              {
                q: "What is VelaBuilt?",
                a: "A creative technology studio that designs and builds websites and interactive experiences, AI agents, business automation, and operational systems such as CRMs and dashboards.",
              },
              {
                q: "Who does VelaBuilt work with?",
                a: "Established businesses whose digital presence has fallen behind the quality of their work — typically winning work through reputation while losing opportunities online.",
              },
              {
                q: "What makes VelaBuilt different?",
                a: "We build the experience and the infrastructure underneath it. The same studio that designs the website builds the agents, automation and systems that handle what it generates — this site and its voice guide, Vela, are an example.",
              },
              {
                q: "What does VelaBuilt not do?",
                a: "We do not publish results we cannot evidence, guarantee rankings, or sell automation as a substitute for a business having something worth buying.",
              },
            ].map((item) => (
              <div key={item.q} className="panel p-7 lg:p-9">
                <dt className="display-sm">{item.q}</dt>
                <dd className="mt-4 max-w-[50ch] text-[0.98rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="claims-heading" className="relative py-24 lg:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <Reveal>
            <Label>Honesty</Label>
            <h2 id="claims-heading" className="display-md mt-5 max-w-[16ch]">
              What this site does not claim.
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <ul className="border-t border-[color:var(--color-hairline)]">
              {disclosures.map((line) => (
                <li
                  key={line}
                  className="border-b border-[color:var(--color-hairline)] py-5 text-[1.02rem] leading-relaxed text-[color:var(--color-ivory-dim)]"
                >
                  {line}
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-[52ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              A studio that will invent a testimonial will invent a timeline. We
              would rather be the one that does neither.
            </p>

            <div className="mt-10">
              <StartProjectLink variant="primary">Start a project</StartProjectLink>
            </div>
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
              "@type": "AboutPage",
              name: `About ${site.name}`,
              description: site.longDescription,
              url: `${site.url}/about`,
            },
          ]),
        }}
      />
    </>
  );
}
