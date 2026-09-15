import type { Metadata } from "next";
import Link from "next/link";
import { preload } from "react-dom";
import { SCENES, plateSource } from "@/content/scenes";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { faqsFor } from "@/content/faq";
import { workItems } from "@/content/work";
import { pageMetadata } from "@/lib/seo";
import { faqSchema, graph, serviceSchema } from "@/lib/schema";
import { CinematicStage } from "@/components/cinematic/CinematicStage";
import { ChapterIndex } from "@/components/scenes/ChapterIndex";
import { SceneFriction } from "@/components/scenes/SceneFriction";
import { SceneWebsite } from "@/components/scenes/SceneWebsite";
import { SceneEnquiry } from "@/components/scenes/SceneEnquiry";
import { SceneLab } from "@/components/scenes/SceneLab";
import { SceneDiscoverability } from "@/components/scenes/SceneDiscoverability";
import { SceneDestination } from "@/components/scenes/SceneDestination";
import { FaqSection } from "@/components/ui/FaqSection";
import { WorkGrid } from "@/components/work/WorkGrid";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label } from "@/components/ui/Primitives";

export const metadata: Metadata = pageMetadata({
  title: `${site.name} — ${site.tagline}`,
  description: site.shortDescription,
  path: "/",
  bareTitle: true,
});

const homeFaqs = faqsFor("home");

/**
 * The homepage is one continuous journey through one space — but it is a
 * document first. Every chapter below is a real section with a real heading,
 * and the page reads correctly from top to bottom with the canvas removed,
 * scripts disabled or motion reduced.
 */
export default function HomePage() {
  // The opening plate is the page's largest contentful paint. It is already in
  // the HTML, but inside a <picture> deep in <body>; a preload in <head>
  // requests it with the fonts, ahead of the stylesheet, at the size the <img>
  // will pick. `type` keeps browsers without AVIF from fetching a file they skip.
  const opening = plateSource(SCENES[0]!.plate);
  preload(opening.avif, {
    as: "image",
    imageSrcSet: opening.avifSrcSet,
    imageSizes: "100vw",
    fetchPriority: "high",
    type: "image/avif",
  });

  const structuredData = graph([
    ...services.map((service) => serviceSchema(service)),
    faqSchema(homeFaqs),
  ]);

  return (
    <>
      {/* The world, behind everything. Fixed, decorative, never in the way. */}
      <CinematicStage targetId="journey" />
      <ChapterIndex />

      <div id="journey" className="relative">
        <SceneFriction />
        <SceneWebsite />
        <SceneEnquiry />
        <SceneLab />
        <SceneDiscoverability />
        <SceneDestination />
      </div>

      {/* ---- Proof, with its claims attached --------------------------- */}
      <section id="work" aria-labelledby="work-heading" className="relative py-24 lg:py-32">
        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div>
                <Label tone="champagne">Real ideas · Real systems</Label>
                <h2 id="work-heading" className="display-lg mt-5 max-w-[14ch]">
                  Explore our work.
                </h2>
              </div>
              <p className="scrim max-w-[44ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                We publish concepts and working demonstrations. Client work appears
                here when it is delivered and the client has agreed to it — not
                before.
              </p>
            </div>
          </Reveal>

          <div className="mt-14">
            <WorkGrid items={workItems.slice(0, 4)} />
          </div>

          <Reveal delay={140} className="mt-10">
            <Link href="/work" className="btn btn-secondary">
              <span>All work</span>
              <ArrowRight />
            </Link>
          </Reveal>
        </div>
      </section>

      <FaqSection entries={homeFaqs} heading="Straight answers." />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
    </>
  );
}
