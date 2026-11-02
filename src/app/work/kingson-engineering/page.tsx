import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { workItems } from "@/content/work";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ArrowRight, CategoryBadge, Label } from "@/components/ui/Primitives";
import { Reveal } from "@/components/ui/Reveal";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "Kingson Engineering — steelwork & fabrication, Zimbabwe",
  description:
    "A cinematic steelwork website with project films, detailed service pages and a clear quotation journey, designed and built by VelaBuilt.",
  path: "/work/kingson-engineering",
});

const project = workItems.find((item) => item.slug === "kingson-engineering")!;
const crumbs = [
  { name: "Home", path: "/" },
  { name: "Work", path: "/work" },
  { name: "Kingson Engineering", path: "/work/kingson-engineering" },
];

const decisions = [
  {
    title: "Let the work lead.",
    body: "Large project photography, restrained typography and integrated films bring the workshop and steel structures into view. The visual direction comes from the work itself, giving the business a distinctive presence across desktop and mobile.",
  },
  {
    title: "Make technical detail useful.",
    body: "Dedicated service pages explain structural steel, roofing, laser cutting, fabrication and cranage. Material ranges, specifications and helpful answers give visitors the detail they need before starting a conversation.",
  },
  {
    title: "Turn interest into a clear brief.",
    body: "Quotation guidance explains which drawings, dimensions and material details to send. Service-aware enquiries and direct contact options make the next step clear, including when a customer has no drawings yet.",
  },
  {
    title: "Build for the way people browse.",
    body: "Responsive images, video fallbacks and reduced-motion support keep the experience usable across devices. Search metadata and structured service information make the same content easier for search tools to understand.",
  },
];

export default function KingsonEngineeringPage() {
  return (
    <>
      <section data-chapter="page-project" className="page-hero">
        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />
          <Reveal className="mt-10">
            <CategoryBadge tone="champagne">Client Work</CategoryBadge>
            <h1 className="display-xl mt-6 max-w-[14ch]">Kingson Engineering.</h1>
            <p className="label mt-5">{project.context}</p>
            <p className="lede mt-9 max-w-[48ch]">{project.response}</p>
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-9">
              <span>Visit the live site</span><ArrowRight />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">
        <section aria-label="The delivered website" className="shell pb-8">
          <Reveal>
            <figure className="panel overflow-hidden !border-0">
              <Image src="/work/kingson-engineering/desktop.webp" alt="Kingson Engineering’s live website on desktop, presenting its steelwork and quotation journey." width={1600} height={1000} sizes="(min-width: 1280px) 1200px, 100vw" className="block h-auto w-full" />
              <figcaption className="px-6 py-4 text-sm text-[color:var(--color-muted)]">The delivered Kingson Engineering website.</figcaption>
            </figure>
          </Reveal>
        </section>

        <section aria-labelledby="brief-heading" className="shell grid gap-10 py-16 lg:grid-cols-2">
          <Reveal>
            <Label>The brief</Label>
            <h2 id="brief-heading" className="display-md mt-5">Show the craft. Explain the capability.</h2>
            <p className="mt-6 max-w-[50ch] leading-relaxed">Kingson Engineering is a steelwork and fabrication business in Harare, Zimbabwe. The website needed to present the physical work with confidence while helping customers understand the services and prepare an enquiry.</p>
            <p className="mt-5 max-w-[50ch] leading-relaxed text-[color:var(--color-muted)]">{project.problem}</p>
          </Reveal>
          <Reveal delay={120}>
            <Label>What we delivered</Label>
            <ul className="mt-6 flex flex-wrap gap-3">
              {project.disciplines.map((discipline) => <li key={discipline} className="label border border-[color:var(--color-hairline)] px-4 py-3">{discipline}</li>)}
            </ul>
          </Reveal>
        </section>

        <section aria-labelledby="approach-heading" className="shell py-16">
          <Reveal><Label>The approach</Label><h2 id="approach-heading" className="display-lg mt-5 max-w-[20ch]">A strong first impression, with the detail to back it up.</h2></Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {decisions.map((decision, index) => <Reveal key={decision.title} delay={index * 90}><h3 className="display-sm">{decision.title}</h3><p className="mt-5 max-w-[52ch] leading-relaxed text-[color:var(--color-muted)]">{decision.body}</p></Reveal>)}
          </div>
        </section>

        <section aria-labelledby="result-heading" className="shell grid items-center gap-12 py-16 lg:grid-cols-2">
          <Reveal className="mx-auto w-full max-w-[390px]">
            <Image src="/work/kingson-engineering/mobile.webp" alt="The Kingson Engineering website on a phone." width={780} height={1328} sizes="(min-width: 768px) 390px, 90vw" className="h-auto w-full border border-[color:var(--color-hairline)]" />
          </Reveal>
          <Reveal delay={120}>
            <Label>The delivered experience</Label>
            <h2 id="result-heading" className="display-md mt-5">From seeing the work to asking for a price.</h2>
            <p className="mt-6 max-w-[48ch] leading-relaxed">A complete website that combines visual storytelling, practical technical information and an enquiry journey suited to the way steelwork is quoted. Explore the live site to see the films, service pages and interactions in context.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View live site <ArrowRight /><span className="sr-only">(opens in a new tab)</span></a>
              <StartProjectLink variant="ghost">Start a project</StartProjectLink>
            </div>
            <Link href="/work" className="btn btn-ghost mt-6">Back to all work <ArrowRight /></Link>
          </Reveal>
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph([breadcrumbSchema(crumbs)]) }} />
    </>
  );
}
