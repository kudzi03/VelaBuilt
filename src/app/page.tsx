import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { workItems } from "@/content/work";
import { GATES } from "@/content/signal-path";
import { pageMetadata } from "@/lib/seo";
import { graph, serviceSchema } from "@/lib/schema";
import { SignalStage } from "@/components/signal/SignalStage";
import { GateBeat } from "@/components/signal/GateBeat";
import { WorkGrid } from "@/components/work/WorkGrid";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { WorldStage } from "@/components/world/WorldStage";

export const metadata: Metadata = pageMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.shortDescription,
  path: "/",
  bareTitle: true,
});

/**
 * THE HOMEPAGE IS ONE JOURNEY, TOLD SEVEN TIMES OVER.
 *
 * An inquiry enters the system at the top of the page and reaches a person at
 * the bottom. The scene behind the page builds the route as the visitor
 * travels it — which is the product, not an ornament, and the reason the
 * sequence is ordered the way it is.
 *
 * It is a document first. Every beat below is a real section with a real
 * heading, and the page reads correctly top to bottom with the canvas gone,
 * scripts disabled or motion reduced. The largest contentful paint is the
 * opening line of type, not an image: there is nothing to download before the
 * page says what it is.
 */
export default function HomePage() {
  const structuredData = graph([
    ...services.map((service) => serviceSchema(service)),
  ]);

  return (
    <>
      {/* The world, behind everything. Fixed, decorative, never in the way. */}
      <SignalStage targetId="journey" />

      {/* ---- 1. OPENING ------------------------------------------------- */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-[100svh] flex-col justify-center pt-[var(--nav-height)]"
      >
        <div className="shell w-full">
          <Reveal className="on-plate max-w-[20ch]">
            <Label tone="champagne">Digital infrastructure, engineered</Label>
            <h1 id="hero-heading" className="display-xl mt-7">
              Nothing arrives and <span className="foil">gets forgotten.</span>
            </h1>
          </Reveal>

          <Reveal delay={140} className="on-plate mt-10 max-w-[48ch]">
            <p className="lede">
              We design the website, and we build the system behind it — so an
              inquiry becomes a record, a reply and a conversation without
              anyone having to remember it.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-6">
              <StartProjectLink variant="primary">Start a project</StartProjectLink>
              <Link href="#arrives" className="btn btn-ghost">
                <span className="inline-flex items-center gap-3">
                  Follow an inquiry through
                  <ArrowRight />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 2. THE FRICTION -------------------------------------------- */}
      <section
        aria-labelledby="friction-heading"
        className="relative flex min-h-[90svh] flex-col justify-center py-24"
      >
        <div className="shell w-full">
          <Reveal className="on-plate max-w-[24ch]">
            <h2 id="friction-heading" className="display-lg">
              Most businesses don&rsquo;t have a software problem.
              <span className="mt-4 block text-[color:var(--color-muted)]">
                They have seven of them, and none of them speak.
              </span>
            </h2>
          </Reveal>

          <Reveal delay={140} className="reading-ground mt-14 max-w-[58ch]">
            <div className="prose-vb">
              <p>
                The website sits in one place. The inquiries land somewhere
                else. What was promised on the phone is in someone&rsquo;s head,
                the quote is in an inbox, and the follow-up is on a sticky note.
              </p>
              <p>
                Everything technically works. The business still loses good
                work, because the parts were never designed to run as one thing.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 3. WHAT WE BUILD ------------------------------------------- */}
      <section aria-labelledby="build-heading" className="relative py-24 lg:py-32">
        <div className="shell">
          <Reveal className="on-plate max-w-[26ch]">
            <Label tone="champagne">What we build</Label>
            <h2 id="build-heading" className="display-lg mt-5">
              Three parts of one system.
            </h2>
          </Reveal>

          <ul className="mt-16 grid gap-px bg-[color:var(--color-hairline)] lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal as="li" key={service.slug} delay={index * 90}>
                <Link
                  href={`/${service.slug}`}
                  className="panel panel-interactive group flex h-full flex-col justify-between gap-12 !border-0 p-8 lg:p-10"
                >
                  <div>
                    <Label tone="champagne">{service.index}</Label>
                    <h3 className="display-sm mt-5">{service.name}</h3>
                    <p className="mt-5 text-sm leading-relaxed text-[color:var(--color-muted)]">
                      {service.summary}
                    </p>
                  </div>
                  <span className="label label-champagne inline-flex items-center gap-3">
                    How it works
                    <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- 4. HOW THE SYSTEM WORKS ------------------------------------
          The scene travels this. Each gate below is the stage the camera is
          passing, so the words and the world are the same thing said twice. */}
      <div id="journey" className="relative">
        <h2 className="sr-only">How the system works, from inquiry to a decision</h2>
        {GATES.map((gate, index) => (
          <GateBeat key={gate.id} gate={gate} index={index} total={GATES.length} />
        ))}
      </div>

      {/* ---- 5. SELECTED WORK -------------------------------------------- */}
      <section id="work" aria-labelledby="work-heading" className="relative py-24 lg:py-32">
        <div className="shell">
          <Reveal className="on-plate max-w-[34ch]">
            <Label tone="champagne">Selected work</Label>
            <h2 id="work-heading" className="display-lg mt-5">
              Built, and in use.
            </h2>
          </Reveal>

          <div className="mt-16">
            <WorkGrid items={workItems.slice(0, 3)} />
          </div>

          <Reveal delay={140} className="mt-12">
            <Link href="/work" className="btn btn-ghost">
              <span className="inline-flex items-center gap-3">
                All work
                <ArrowRight />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ---- 6. THE LAB --------------------------------------------------- */}
      <section aria-labelledby="lab-heading" className="relative py-24 lg:py-32">
        <div className="shell">
          <Reveal className="reading-ground">
            <div className="flex flex-wrap items-end justify-between gap-10">
              <div className="max-w-[26ch]">
                <Label tone="champagne">System Lab</Label>
                <h2 id="lab-heading" className="display-md mt-5">
                  The same system, but you can take it apart.
                </h2>
              </div>
              <p className="max-w-[40ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                Select a module to see what it does, what it hands off to, and
                what a person still decides. Structure only — no customer data
                appears anywhere in it.
              </p>
            </div>

            <div className="mt-10">
              <Link href="/system-lab" className="btn btn-primary">
                <span className="inline-flex items-center gap-3">
                  Open the System Lab
                  <ArrowRight />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- 7. CONVERSION ------------------------------------------------ */}
      <section
        aria-labelledby="close-heading"
        className="relative flex min-h-[80svh] flex-col justify-center py-24"
      >
        <div className="shell w-full">
          <Reveal className="on-plate max-w-[20ch]">
            <h2 id="close-heading" className="display-lg">
              Tell us what is <span className="foil">not working.</span>
            </h2>
          </Reveal>

          <Reveal delay={120} className="on-plate mt-9 max-w-[46ch]">
            <p className="lede">
              Four short questions. A person reads every one of them and replies
              with an honest assessment — including when we are not the right
              people for it.
            </p>
            <div className="mt-11">
              <StartProjectLink variant="primary">Start a project</StartProjectLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The facility. It mounts over this page on capable devices and is
          dismissed back to it; the markup above is never removed, which is
          what keeps the site crawlable and usable without WebGL. */}
      <WorldStage />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
    </>
  );
}
