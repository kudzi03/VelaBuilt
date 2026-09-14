import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { PageBackdrop } from "@/components/cinematic/PageBackdrop";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "Approach",
  description:
    "How VelaBuilt works: understand the problem before proposing a solution, demonstrate rather than describe, build the smallest thing that fixes it, and hand over something you can run.",
  path: "/approach",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Approach", path: "/approach" },
];

const STAGES = [
  {
    title: "Understand the problem",
    body: "Not the brief — the problem. Where work is being lost, what the business already tried, and what is actually in the way. Most projects go wrong here, before anyone opens a design tool.",
  },
  {
    title: "Establish what is true",
    body: "What the site does today, where enquiries go, what is measured and what is guessed. We would rather find out that a rebuild is unnecessary than sell one.",
  },
  {
    title: "Demonstrate, don’t describe",
    body: "We show the thing working before it is finished. A demonstration you can click settles arguments that a document cannot.",
  },
  {
    title: "Build the smallest thing that fixes it",
    body: "Scope grows quietly and takes projects with it. We build what the problem requires, properly, and leave room for what comes next.",
  },
  {
    title: "Hand over the controls",
    body: "Documentation, access and a walkthrough. If you cannot change the follow-up message yourself, we have not finished the job.",
  },
] as const;

const PRINCIPLES = [
  {
    title: "Problems before terminology",
    body: "You should not need to know what a webhook is to buy from us. We lead with the thing that is going wrong, and keep the implementation where it belongs — in the build.",
  },
  {
    title: "No invented proof",
    body: "No fabricated testimonials, no borrowed client logos, no ranking screenshots, no dashboards of made-up numbers. Concepts are labelled concepts. Demonstrations are labelled demonstrations.",
  },
  {
    title: "Automation with a person in it",
    body: "Systems act where the action is obvious and escalate where it is not. Nothing that commits the business happens without a human decision behind it.",
  },
  {
    title: "Performance is a design requirement",
    body: "A beautiful site that takes six seconds to load is a broken site. Speed, accessibility and structure are part of the design work, not a phase afterwards.",
  },
  {
    title: "You own it",
    body: "Your accounts, your data, your domain, your exports. We build systems you could take elsewhere — which is the only honest way to ask you to stay.",
  },
  {
    title: "We will say no",
    body: "If the work will not achieve what you want, or the timing is wrong, we say so before an invoice exists rather than after.",
  },
] as const;

export default function ApproachPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-[calc(var(--nav-height)+5rem)]">
        <PageBackdrop plate="website-chamber" focal={[0.6, 0.5]} presence={0.38} />

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <Label tone="champagne">Approach</Label>
            <h1 className="display-xl mt-6 max-w-[15ch]">
              Understand it first. <span className="foil">Then build it.</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[54ch]">
              Most digital projects fail quietly: the wrong problem is solved
              beautifully. Everything below exists to stop that happening.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="stages-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label tone="champagne">How a project runs</Label>
            <h2 id="stages-heading" className="display-lg mt-5 max-w-[16ch]">
              Five stages, in order.
            </h2>
          </Reveal>

          <ol className="mt-14 border-t border-[color:var(--color-hairline)]">
            {STAGES.map((stage, index) => (
              <Reveal as="li" key={stage.title} delay={index * 70}>
                <div className="grid gap-6 border-b border-[color:var(--color-hairline)] py-10 lg:grid-cols-[6rem_1fr_1.2fr] lg:gap-12">
                  <Label tone="champagne" as="span">
                    {String(index + 1).padStart(2, "0")}
                  </Label>
                  <h3 className="display-sm max-w-[18ch]">{stage.title}</h3>
                  <p className="max-w-[58ch] text-[0.98rem] leading-relaxed text-[color:var(--color-muted)]">
                    {stage.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="principles-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label tone="champagne">Principles</Label>
            <h2 id="principles-heading" className="display-lg mt-5 max-w-[18ch]">
              What we hold to, including when it costs us the project.
            </h2>
          </Reveal>

          <ul className="mt-14 grid gap-px bg-[color:var(--color-hairline)] md:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <Reveal as="li" key={principle.title} delay={index * 60}>
                <div className="panel h-full !border-0 p-8">
                  <h3 className="display-sm">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={140} className="mt-14">
            <StartProjectLink variant="primary">Start a project</StartProjectLink>
          </Reveal>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: graph([breadcrumbSchema(crumbs)]) }}
      />
    </>
  );
}
