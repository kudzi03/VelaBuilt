import Link from "next/link";
import { services, type Service } from "@/content/services";
import { faqsFor } from "@/content/faq";
import { graph, breadcrumbSchema, faqSchema, serviceSchema, webPageSchema } from "@/lib/schema";
import { CapabilityCards } from "@/components/home/CapabilityCards";
import { FocusReceiver } from "@/components/home/FocusReceiver";
import { TalkButton } from "@/voice/VoiceRoot";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqSection } from "@/components/ui/FaqSection";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import type { Focus } from "@/content/enquiry-flow";


export function ServicePage({
  service,
  focus,
}: {
  readonly service: Service;
  readonly focus: Focus;
}) {
  const faqs = faqsFor(service.slug);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: service.name, path: `/${service.slug}` },
  ];

  const others = services.filter((entry) => entry.slug !== service.slug && entry.area !== "discover");

  const structuredData = graph([
    webPageSchema({ path: `/${service.slug}`, name: service.name, description: service.summary }),
    serviceSchema(service),
    breadcrumbSchema(crumbs),
    faqSchema(faqs),
  ]);

  return (
    <>
      <FocusReceiver />

      {/* ---- Opening: the structure stands in this area's form ----------- */}
      <section data-chapter={service.chapter} className="page-hero">
        <div className="shell relative w-full">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10 max-w-[40rem]">
            <p className="label">
              {service.index} — {service.name}
            </p>
            <h1 className="display-xl mt-6">
              {service.headline[0]}
              <span className="mt-3 block text-[color:var(--color-muted)]">{service.headline[1]}</span>
            </h1>
          </Reveal>

          <Reveal delay={120} className="ground mt-10 max-w-[40rem]">
            <p className="lede max-w-[54ch]">{service.summary}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <StartProjectLink variant="primary" focus={focus}>
                {service.cta}
              </StartProjectLink>
              <TalkButton className="btn">Ask Vela about it</TalkButton>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">
      {/* ---- What it covers --------------------------------------------- */}
      <section id={service.area} aria-labelledby="covers-heading" className="relative pt-24 lg:pt-28">
        <div className="shell">
          <Reveal>
            <Label>What it covers</Label>
            <h2 id="covers-heading" className="display-lg mt-5 max-w-[20ch]">
              {service.chapterHeading}
            </h2>
          </Reveal>
          <div className="mt-12">
            <CapabilityCards service={service} />
          </div>
        </div>
      </section>

      {/* ---- Who it is for, and what is going wrong --------------------- */}
      <section aria-labelledby="problem-heading" className="relative py-24 lg:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <Reveal>
            <Label>Who this is for</Label>
            <h2 id="problem-heading" className="display-sentence mt-5 max-w-[28ch]">
              {service.audience}
            </h2>
            <p className="mt-8 max-w-[46ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
              {service.proposition}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <Label>What that usually looks like</Label>
            <ul className="mt-6 border-t border-[color:var(--color-hairline)]">
              {service.problems.map((problem) => (
                <li
                  key={problem}
                  className="border-b border-[color:var(--color-hairline)] py-5 text-[1.02rem] leading-relaxed text-[color:var(--color-ivory-dim)]"
                >
                  {problem}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---- The engagement --------------------------------------------- */}
      <section aria-labelledby="process-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label>The engagement</Label>
            <h2 id="process-heading" className="display-lg mt-5 max-w-[16ch]">
              How the work runs.
            </h2>
          </Reveal>

          <ol className="mt-14 grid gap-3 lg:grid-cols-4">
            {service.process.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 90}>
                <div className="panel flex h-full flex-col p-7">
                  <Label as="span">
                    {String(index + 1).padStart(2, "0")}
                  </Label>
                  <h3 className="display-sm mt-5">{step.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Capabilities and boundaries -------------------------------- */}
      <section aria-labelledby="capabilities-heading" className="relative py-24 lg:py-28">
        <div className="shell grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          <Reveal>
            <Label>What is included</Label>
            <h2 id="capabilities-heading" className="display-md mt-5">
              The capabilities behind it.
            </h2>
            <ul className="mt-9 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {service.capabilities.map((capability) => (
                <li
                  key={capability}
                  className="border-b border-[color:var(--color-hairline)] pb-3 text-[0.98rem] text-[color:var(--color-ivory-dim)]"
                >
                  {capability}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <div className="panel h-full p-8">
              <Label>What this is not</Label>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
                {service.boundary}
              </p>
              <p className="mt-6 text-sm leading-relaxed text-[color:var(--color-faint)]">
                We would rather lose a project than sell one that will not work.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection entries={faqs} heading="Straight answers." id="service-faq" />

      {/* ---- Where to go next ------------------------------------------- */}
      <section aria-labelledby="related-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label>Also relevant</Label>
            <h2 id="related-heading" className="display-md mt-5">
              The rest of the system.
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-3 md:grid-cols-3">
            {others.map((entry, index) => (
              <Reveal as="li" key={entry.slug} delay={index * 100}>
                <Link
                  href={`/${entry.slug}`}
                  className="panel panel-interactive group flex h-full flex-col justify-between gap-10 p-7 lg:p-9"
                >
                  <div>
                    <Label as="span">
                      {entry.index}
                    </Label>
                    <h3 className="display-md mt-5">{entry.name}</h3>
                    <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                      {entry.summary}
                    </p>
                  </div>
                  <span className="label label-champagne inline-flex items-center gap-3">
                    Explore
                    <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
    </>
  );
}
