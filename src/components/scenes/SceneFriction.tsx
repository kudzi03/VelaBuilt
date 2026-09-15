import Link from "next/link";
import { CHAPTERS } from "@/lib/journey";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { ChapterFrame } from "./ChapterFrame";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label, StackedLabel } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

const chapter = CHAPTERS[0]!;

/** The systems a business already has, none of which know about each other. */
const DISCONNECTED = [
  "Website",
  "Inbox",
  "Spreadsheet",
  "Calendar",
  "CRM",
  "Messages",
  "Notes",
] as const;

export function SceneFriction() {
  return (
    <>
      {/* ---- The opening frame ------------------------------------------ */}
      <section
        id="friction"
        aria-labelledby="hero-heading"
        data-chapter={0}
        className="relative flex min-h-[100svh] flex-col justify-end pb-16 pt-[calc(var(--nav-height)+4rem)] lg:pb-24"
      >
        <div className="shell on-world w-full">
          <div className="flex items-end justify-between gap-10">
            <div className="max-w-4xl">
              <Reveal>
                <StackedLabel lines={["Ideas", "Systems", "Reality"]} className="mb-10" />
              </Reveal>

              <Reveal delay={90}>
                <h1 id="hero-heading" className="display-xl">
                  Systems for what&rsquo;s{" "}
                  <em className="foil not-italic">
                    <span className="italic">next.</span>
                  </em>
                </h1>
              </Reveal>

              <Reveal delay={180}>
                <p className="lede mt-9 max-w-[44ch]">
                  Premium websites, follow-up systems and intelligent digital
                  infrastructure for modern businesses.
                </p>
              </Reveal>

              {/* Available immediately. Nobody waits out an animation to act. */}
              <Reveal delay={260}>
                <div className="mt-11 flex flex-wrap items-center gap-4">
                  <StartProjectLink variant="primary">Start a project</StartProjectLink>
                  <Link href="/work" className="btn btn-ghost">
                    <span>See what we build</span>
                    <ArrowRight />
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal delay={340} className="hidden shrink-0 text-right xl:block">
              <p className="label leading-[2.1]">
                A<br />
                more
                <br />
                capable
                <br />
                tomorrow
              </p>
              <span
                aria-hidden="true"
                className="mt-4 ml-auto block h-px w-8 bg-[color:var(--color-champagne-deep)]"
              />
            </Reveal>
          </div>
        </div>

        <div className="shell mt-16 w-full">
          <span aria-hidden="true" className="rule block" />
        </div>

        {/* ---- Capabilities, stated plainly ----------------------------- */}
        <div className="shell on-world mt-10 w-full">
          <h2 className="sr-only">What VelaBuilt builds</h2>
          <ul className="grid gap-8 sm:grid-cols-3">
            {CAPABILITIES.map((capability, index) => (
              <Reveal as="li" key={capability.title} delay={index * 90}>
                <div className="flex items-start gap-5">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-hairline-strong)] text-[color:var(--color-champagne)]"
                  >
                    {capability.icon}
                  </span>
                  <span>
                    <span className="display-sm block text-[color:var(--color-ivory)]">
                      {capability.title}
                    </span>
                    <span className="label mt-2 block leading-[1.8]">
                      {capability.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- The friction ------------------------------------------------ */}
      <ChapterFrame
        chapter={chapter}
        id="friction-detail"
        headingId="friction-heading"
        className="!min-h-0 !py-24 lg:!py-32"
      >
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
          <Reveal>
            <h2 id="friction-heading" className="display-lg">
              Most businesses don&rsquo;t have a software problem.
              <span className="mt-3 block text-[color:var(--color-muted)]">
                They have seven of them, and none of them speak.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={140}>
            <div className="prose-vb max-w-[52ch]">
              <p>
                The website sits in one place. The inquiries land somewhere else.
                What was promised on the phone is in someone&rsquo;s head, the
                quote is in an inbox, and the follow-up is on a sticky note.
              </p>
              <p>
                Everything technically works. The business still loses good work,
                because the parts were never designed to run as one thing.
              </p>
            </div>

            <ul className="mt-10 flex flex-wrap gap-2.5">
              {DISCONNECTED.map((item) => (
                <li
                  key={item}
                  className="border border-[color:var(--color-hairline)] px-3.5 py-2 text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </ChapterFrame>

      {/* ---- The three offers, at a glance ------------------------------ */}
      <section
        id="solutions"
        aria-labelledby="solutions-heading"
        className="relative py-24 lg:py-32"
      >
        <div className="shell on-world">
          <div className="grid gap-12 lg:grid-cols-[auto_1fr_auto] lg:items-end">
            <Reveal>
              <StackedLabel lines={["Built", "for", "what’s", "next"]} />
            </Reveal>

            <Reveal delay={100}>
              <h2 id="solutions-heading" className="display-lg max-w-[16ch]">
                Solutions that move business forward.
              </h2>
            </Reveal>

            <Reveal delay={180} className="max-w-[38ch]">
              <p className="text-sm leading-relaxed text-[color:var(--color-ivory-dim)]">
                {site.longDescription}
              </p>
            </Reveal>
          </div>

          <ul className="mt-16 grid gap-px border border-[color:var(--color-hairline)] bg-[color:var(--color-hairline)] lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal as="li" key={service.slug} delay={index * 110}>
                <Link
                  href={`/${service.slug}`}
                  className="panel panel-interactive group flex h-full flex-col justify-between gap-10 !border-0 p-8 lg:p-10"
                >
                  <div>
                    <Label tone="champagne" as="span">
                      {service.index}
                    </Label>
                    <h3 className="display-md mt-5">{service.name}</h3>
                    <p className="mt-5 text-sm leading-relaxed text-[color:var(--color-muted)]">
                      {service.summary}
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
    </>
  );
}

const CAPABILITIES = [
  {
    title: "Websites",
    lines: ["High-performance", "digital experiences"],
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="1.5" y="3.5" width="17" height="13" />
        <path d="M1.5 7.5h17M4.5 5.5h1.5" />
      </svg>
    ),
  },
  {
    title: "Automation",
    lines: ["Streamline operations", "save time, scale faster"],
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M10 2.2 18 6.4l-8 4.2-8-4.2 8-4.2Z" />
        <path d="m2 10.4 8 4.2 8-4.2M2 14.2l8 4.2 8-4.2" />
      </svg>
    ),
  },
  {
    title: "AI Systems",
    lines: ["Practical AI for", "real business impact"],
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M13.4 3.2a4.6 4.6 0 0 1 1.9 8.3v4.1a1.4 1.4 0 0 1-1.4 1.4H8.6v-2.6H6.1a1.2 1.2 0 0 1-1.1-1.7l1-2.3H4.3a4.9 4.9 0 0 1 9.1-7.2Z" />
      </svg>
    ),
  },
] as const;
