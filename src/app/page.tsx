import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { primaryServices, services } from "@/content/services";
import { faqsFor } from "@/content/faq";
import { workItems } from "@/content/work";
import { pageMetadata } from "@/lib/seo";
import { faqSchema, graph, serviceSchema, webPageSchema } from "@/lib/schema";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { CapabilityCards } from "@/components/home/CapabilityCards";
import { FocusReceiver } from "@/components/home/FocusReceiver";
import { TalkButton } from "@/voice/VoiceRoot";

export const metadata: Metadata = pageMetadata({
  title: `${site.name} — Websites, AI agents, automation and business systems`,
  description: site.shortDescription,
  path: "/",
  bareTitle: true,
});

/**
 * THE HOMEPAGE IS ONE SPACE.
 *
 * The object behind the page is the same structure throughout; each section
 * below names the form it takes (`data-chapter`), and it rebuilds itself as
 * the visitor arrives. Solid sheets travel over it where there is reading to
 * do. Every word is real HTML in document order: with the canvas gone,
 * scripts off or motion reduced, this reads top to bottom as a complete page.
 */
export default function HomePage() {
  const cardio = workItems.find((w) => w.slug === "cardio-life");
  const answers = faqsFor("home");

  const structuredData = graph([
    webPageSchema({ path: "/", name: `${site.name} — ${site.tagline}`, description: site.shortDescription }),
    ...services.map((service) => serviceSchema(service)),
    faqSchema(answers),
  ]);

  return (
    <>
      <FocusReceiver />

      {/* ── 01 · OPENING ─────────────────────────────────────────────────── */}
      <section
        id="opening"
        data-chapter="opening"
        data-label="VelaBuilt"
        aria-labelledby="opening-heading"
        className="chapter chapter--opening"
      >
        <div className="shell grid w-full gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <Reveal>
            <p className="label">VelaBuilt · Digital infrastructure studio</p>
            <h1 id="opening-heading" className="display-xl mt-5 max-w-[14ch]">
              We build the systems a business runs on.
            </h1>
          </Reveal>
          <Reveal delay={160} className="ground lg:justify-self-end">
            <p className="lede">
              Websites that carry the weight of the business. AI agents that answer from what it
              actually knows. Automation that follows up every enquiry. And the CRMs and dashboards
              that hold it together.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#capabilities" className="btn btn-primary">
                <span>Explore</span>
                <ArrowRight />
              </Link>
              <TalkButton className="btn">Talk to Vela</TalkButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 02–05 · WHAT WE BUILD ────────────────────────────────────────── */}
      <div id="capabilities">
        <h2 className="sr-only">What VelaBuilt builds</h2>
        {primaryServices.map((service, i) => (
          <section
            key={service.slug}
            id={service.area}
            data-chapter={service.area}
            data-label={service.name}
            aria-labelledby={`${service.area}-heading`}
            className="chapter"
          >
            <div className="shell w-full">
              <div className="ground max-w-[36rem]">
                <Reveal>
                  <p className="label chapter__index">
                    {String(i + 2).padStart(2, "0")} — {service.name}
                  </p>
                  <h3 id={`${service.area}-heading`} className="display-lg mt-5">
                    {service.chapterHeading}
                  </h3>
                  <p className="mt-6 max-w-[48ch] leading-relaxed">{service.chapterBody}</p>
                </Reveal>
                <div className="mt-9">
                  <CapabilityCards service={service} headingLevel="h4" />
                </div>
                <Reveal delay={420} className="mt-8">
                  <Link href={`/${service.slug}`} className="btn btn-ghost">
                    <span>{service.name}: how it works</span>
                    <ArrowRight />
                  </Link>
                </Reveal>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── 06 · WORK ────────────────────────────────────────────────────── */}
      {cardio ? (
        <section
          id="work"
          data-chapter="work"
          data-label="Work"
          aria-labelledby="work-heading"
          className="sheet"
        >
          <div className="shell py-24 lg:py-32">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label">06 — Selected work</p>
                <h2 id="work-heading" className="display-lg mt-5">
                  Built, and in use.
                </h2>
              </div>
              <Link href="/work" className="btn btn-ghost">
                <span>All work</span>
                <ArrowRight />
              </Link>
            </Reveal>

            <article className="mt-14 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <Reveal className="work-frame">
                <Link href={cardio.href ?? "/work"} aria-label="Cardio Life — read the case study">
                  <Image
                    src="/work/cardio-life/desktop.webp"
                    alt="The Cardio Life website on desktop: training courses and accreditation, with a quotation path."
                    width={1600}
                    height={1000}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="work-frame__shot"
                  />
                </Link>
                <Image
                  src="/work/cardio-life/mobile.webp"
                  alt="The Cardio Life website on a phone."
                  width={780}
                  height={1328}
                  sizes="(min-width: 1024px) 14vw, 30vw"
                  className="work-frame__phone"
                />
              </Reveal>
              <Reveal delay={150}>
                <p className="label">{cardio.context}</p>
                <h3 className="display-md mt-4">{cardio.title}</h3>
                <p className="mt-5 leading-relaxed">{cardio.response}</p>
                <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
                  {cardio.problem}
                </p>
                <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5">
                  {cardio.disciplines.map((d) => (
                    <li key={d} className="label">
                      {d}
                    </li>
                  ))}
                </ul>
                {cardio.priorToStudio ? (
                  <p className="mt-6 text-sm text-[color:var(--color-muted)]">
                    Delivered by the founder before the VelaBuilt studio identity existed.
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={cardio.href ?? "/work"} className="btn btn-primary">
                    <span>Read the case study</span>
                    <ArrowRight />
                  </Link>
                  {cardio.liveUrl ? (
                    <a href={cardio.liveUrl} className="btn" target="_blank" rel="noopener noreferrer">
                      <span>Visit the live site</span>
                      <span aria-hidden="true">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : null}
                </div>
              </Reveal>
            </article>
          </div>
        </section>
      ) : null}

      {/* ── 07 · PLAIN ANSWERS ───────────────────────────────────────────── */}
      <section
        id="answers"
        data-chapter="answers"
        data-label="Answers"
        aria-labelledby="answers-heading"
        className="sheet"
      >
        <div className="shell py-24 lg:py-32">
          <Reveal className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="label">07 — Plain answers</p>
              <h2 id="answers-heading" className="display-lg mt-5 max-w-[12ch]">
                VelaBuilt, in plain terms.
              </h2>
            </div>
            <dl className="answers">
              {answers.map((a) => (
                <div key={a.question} className="answers__row">
                  <dt className="display-sm">{a.question}</dt>
                  <dd className="mt-2.5 leading-relaxed text-[color:var(--color-ivory-dim)]">{a.answer}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── 08 · CONTACT ─────────────────────────────────────────────────── */}
      <section
        id="contact"
        data-chapter="contact"
        data-label="Contact"
        aria-labelledby="contact-heading"
        className="chapter chapter--contact"
      >
        <div className="shell w-full">
          <Reveal className="ground mx-auto max-w-[48rem] text-center">
            <p className="label">08 — Start</p>
            <h2 id="contact-heading" className="display-lg mt-5">
              Tell us what you’re building.
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] leading-relaxed">
              Four short questions, or a conversation with Vela. A person reads every enquiry and
              replies with an honest assessment — including when we are not the right people for it.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <StartProjectLink variant="primary">Start a project</StartProjectLink>
              <TalkButton className="btn">Talk to Vela</TalkButton>
            </div>
            <p className="mt-6 text-sm text-[color:var(--color-muted)]">
              Or email{" "}
              <a href={`mailto:${site.email}`} className="underline underline-offset-4">
                {site.email}
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
    </>
  );
}
