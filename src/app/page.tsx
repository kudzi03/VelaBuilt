import { RestaurantShowcase } from "@/components/home/RestaurantShowcase";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { faqsFor } from "@/content/faq";
import { workItems } from "@/content/work";
import { journeyOpening, journeyStages } from "@/content/journey";
import { pageMetadata } from "@/lib/seo";
import { faqSchema, graph, serviceSchema, webPageSchema } from "@/lib/schema";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { JourneyFilm } from "@/components/home/JourneyFilm";
import styles from "@/components/home/Journey.module.css";

export const metadata: Metadata = pageMetadata({
  title: `${site.name} — Websites, follow-up and business tools`,
  description: site.shortDescription,
  path: "/",
  bareTitle: true,
});

/**
 * THE HOMEPAGE OPENS WITH ONE CUSTOMER'S JOURNEY.
 *
 * A single film (JourneyFilm) plays behind the opening chapters as the visitor
 * scrolls: from being found, to trust, to an enquiry, follow-up and a record,
 * ending on a booked job. The object steps out while the film runs
 * (`journey-*` chapters) and returns for the contact chapter. Solid sheets
 * travel over both where there is reading to do. Every word is real HTML in
 * document order: with scripts off or motion reduced, this reads top to
 * bottom as a complete page.
 */
export default function HomePage() {
  const clientWork = workItems.filter((work) => work.category === "client-work");
  const answers = faqsFor("home");

  const structuredData = graph([
    webPageSchema({ path: "/", name: `${site.name} — ${site.tagline}`, description: site.shortDescription }),
    ...services.map((service) => serviceSchema(service)),
    faqSchema(answers),
  ]);

  return (
    <>

      {/* ── OPENING · the film starts here ──────────────────────────────── */}
      <JourneyFilm />
      <section
        id="opening"
        data-chapter={journeyOpening.id}
        data-film-key={journeyOpening.key}
        data-label={journeyOpening.label}
        aria-labelledby="opening-heading"
        className={`${styles.chapter} ${styles.hero}`}
      >
        <div className={`shell ${styles.heroInner}`}>
          <Reveal className={`${styles.card} ${styles.heroCard}`}>
            <p className="label label-champagne">{journeyOpening.eyebrow}</p>
            <h1 id="opening-heading" className="display-xl mt-5 max-w-[14ch]">
              {journeyOpening.heading}
            </h1>
            <p className={`lede ${styles.body}`}>{journeyOpening.body}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#capabilities" className="btn btn-primary">
                <span>Follow the journey</span>
                <ArrowRight />
              </Link>
              <StartProjectLink variant="ghost">Start a project</StartProjectLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── THE JOURNEY · one customer, first search to booked job ─────────── */}
      <div id="capabilities">
        <h2 className="sr-only">What VelaBuilt builds, step by step</h2>
        {journeyStages.map((stage) => (
          <section
            key={stage.id}
            id={stage.id}
            data-chapter={stage.id}
            data-film-key={stage.key}
            data-label={stage.label}
            aria-labelledby={`${stage.id}-heading`}
            className={styles.chapter}
          >
            <div className="shell">
              <div className={styles.cardSlot}>
                <div className={styles.card}>
                  <p className="label label-champagne">{stage.eyebrow}</p>
                  <h3 id={`${stage.id}-heading`} className="display-lg mt-5">
                    {stage.heading}
                  </h3>
                  <p className={styles.body}>{stage.body}</p>
                  {stage.tags.length > 0 ? (
                    <ul className={`label ${styles.tags}`}>
                      {stage.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                  {stage.service ? (
                    <Link href={`/${stage.service}`} className={`btn btn-ghost ${styles.more}`}>
                      <span>{stage.linkLabel}</span>
                      <ArrowRight />
                    </Link>
                  ) : (
                    <div className="mt-7">
                      <StartProjectLink variant="primary">Start a project</StartProjectLink>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── REAL CLIENT WORK ─────────────────────────────────────────────── */}
      {clientWork.length > 0 ? (
        <section
          id="work"
          data-chapter="work"
          data-label="Work"
          aria-labelledby="work-heading"
          className="sheet"
        >
          <div className="shell py-16 lg:py-20">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="label">Real client work</p>
                <h2 id="work-heading" className="display-lg mt-5">
                  See the work for yourself.
                </h2>
              </div>
              <Link href="/work" className="btn btn-ghost">
                <span>All work</span>
                <ArrowRight />
              </Link>
            </Reveal>

            {clientWork.map((project) => (
              <article key={project.slug} className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
                <Reveal className="work-frame">
                  <Link href={project.href ?? "/work"} aria-label={`${project.title} — read the case study`}>
                    <Image
                      src={`/work/${project.slug}/desktop.webp`}
                      alt={`${project.title} website on desktop.`}
                      width={1600}
                      height={1000}
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="work-frame__shot"
                    />
                  </Link>
                  <Image
                    src={`/work/${project.slug}/mobile.webp`}
                    alt={`${project.title} website on a phone.`}
                    width={780}
                    height={1328}
                    sizes="(min-width: 1024px) 14vw, 30vw"
                    className="work-frame__phone"
                  />
                </Reveal>
                <Reveal delay={150}>
                  <p className="label">{project.context}</p>
                  <h3 className="display-md mt-4">{project.title}</h3>
                  <p className="mt-5 leading-relaxed">{project.response}</p>
                  <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
                    {project.problem}
                  </p>
                  <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1.5">
                    {project.disciplines.map((d) => (
                      <li key={d} className="label">
                        {d}
                      </li>
                    ))}
                  </ul>
                  {project.priorToStudio ? (
                    <p className="mt-6 text-sm text-[color:var(--color-muted)]">
                      Delivered by the founder before the VelaBuilt studio identity existed.
                    </p>
                  ) : null}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={project.href ?? "/work"} className="btn btn-primary">
                      <span>Read the case study</span>
                      <ArrowRight />
                    </Link>
                    {project.liveUrl ? (
                      <a href={project.liveUrl} className="btn" target="_blank" rel="noopener noreferrer">
                        <span>Visit the live site</span>
                        <span aria-hidden="true">↗</span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : null}
                  </div>
                </Reveal>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <RestaurantShowcase />

      {/* ── PLAIN ANSWERS ────────────────────────────────────────────────── */}
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
              <p className="label">Plain answers</p>
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
            <p className="label">Start</p>
            <h2 id="contact-heading" className="display-lg mt-5">
              Tell us what is not working.
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] leading-relaxed">
              Four short questions. A person reads every enquiry and
              replies with an honest assessment — including when we are not the right people for it.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <StartProjectLink variant="primary">Start a project</StartProjectLink>
              <Link href={`mailto:${site.email}`} className="btn">Email the studio</Link>
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
