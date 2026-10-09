import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import { FaqSection } from "@/components/ui/FaqSection";
import { faqsFor } from "@/content/faq";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = pageMetadata({
  title: "Approach",
  description:
    "How VelaBuilt works: understand what is going wrong, show a working example, build what you need and teach your team how to use it.",
  path: "/approach",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Approach", path: "/approach" },
];

const generalFaqs = faqsFor("home");

const STAGES = [
  {
    title: "Understand the problem",
    body: "We look at where work is getting lost, what you have already tried and what is in the way before recommending anything.",
  },
  {
    title: "Establish what is true",
    body: "We check what your website and tools do today, where enquiries go and what you can actually measure. A rebuild may not be needed.",
  },
  {
    title: "Show you how it will work",
    body: "You can try a working example before the whole project is finished and tell us what needs to change.",
  },
  {
    title: "Build what you need",
    body: "We focus on the problem you came to solve and leave room to add more later if it helps.",
  },
  {
    title: "Hand over the controls",
    body: "We give you access, clear instructions and a walkthrough. Your team should be able to change a follow-up message without calling us.",
  },
] as const;

const PRINCIPLES = [
  {
    title: "Problems before terminology",
    body: "You should not have to learn technical terms to tell us what is going wrong. We explain the proposed fix in words you can use.",
  },
  {
    title: "No invented proof",
    body: "No fabricated testimonials, no borrowed client logos, no ranking screenshots, no dashboards of made-up numbers. Concepts are labeled concepts. Demonstrations are labeled demonstrations.",
  },
  {
    title: "Your team stays in charge",
    body: "Tools can handle routine steps. A person makes decisions that affect the business or a customer.",
  },
  {
    title: "The website needs to work well",
    body: "A beautiful website still needs to load quickly, work on a phone and be easy for everyone to use.",
  },
  {
    title: "You own it",
    body: "Your accounts, information and domain belong to you. We show you how to access and take your information with you.",
  },
  {
    title: "We will say no",
    body: "If the work will not achieve what you want, or the timing is wrong, we say so before an invoice exists rather than after.",
  },
] as const;

export default function ApproachPage() {
  return (
    <>

      <section data-chapter="page-lab" className="page-hero">

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <Label>Approach</Label>
            <h1 className="display-xl mt-6 max-w-[15ch]">
              Understand it first. Then build it.
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[54ch]">
              We start with the problem you want to fix, show you how the solution
              will work and build only what your business needs.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">

      <section aria-labelledby="stages-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label>How a project runs</Label>
            <h2 id="stages-heading" className="display-lg mt-5 max-w-[16ch]">
              Five stages, in order.
            </h2>
          </Reveal>

          <ol className="mt-14 border-t border-[color:var(--color-hairline)]">
            {STAGES.map((stage, index) => (
              <Reveal as="li" key={stage.title} delay={index * 70}>
                <div className="grid gap-6 border-b border-[color:var(--color-hairline)] py-10 lg:grid-cols-[6rem_1fr_1.2fr] lg:gap-12">
                  <Label as="span">
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
            <Label>Principles</Label>
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

      <FaqSection entries={generalFaqs} heading="Straight answers." id="faq" />

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: graph([breadcrumbSchema(crumbs), faqSchema(generalFaqs)]),
        }}
      />
    </>
  );
}
