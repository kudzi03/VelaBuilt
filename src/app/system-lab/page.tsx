import type { Metadata } from "next";
import { systemModules } from "@/content/systems";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { SystemLabRoom } from "@/components/lab/SystemLabRoom";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FlowChain } from "@/components/ui/FlowChain";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryBadge, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "See how enquiries and follow-up work together",
  description:
    "See how customer records, follow-up, booking and reporting can work together, with your team in charge of important decisions.",
  path: "/system-lab",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "See How It Works", path: "/system-lab" },
];

export default function SystemLabPage() {
  return (
    <>

      <section data-chapter="page-lab" className="page-hero">

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <CategoryBadge tone="champagne">See how the tools work together</CategoryBadge>
            <h1 className="display-xl mt-6 max-w-[14ch]">
              See what happens after someone gets in touch.
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[54ch]">
              Follow an enquiry from first contact through reply, booking and follow-up.
              See where the tools help and where your team stays in charge.
            </p>
            <p className="mt-6 max-w-[54ch] text-sm text-[color:var(--color-faint)]">
              This is a demonstration. It does not show real customer records or real results.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="sheet" data-chapter="reading">

      <section aria-labelledby="lab-heading" className="relative pb-24" data-demo="system-lab">
        <div className="shell">
          <h2 id="lab-heading" className="sr-only">
            Parts of the example
          </h2>
          <SystemLabRoom />
        </div>
      </section>

      {/* Every module written out, so the page is complete without interaction. */}
      <section aria-labelledby="reference-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label>How each part helps</Label>
            <h2 id="reference-heading" className="display-lg mt-5 max-w-[18ch]">
              Explore each step.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px bg-[color:var(--color-hairline)] md:grid-cols-2">
            {systemModules.map((unit, index) => (
              <Reveal as="article" key={unit.id} delay={index * 60}>
                <div id={unit.id} className="panel h-full !border-0 p-8 lg:p-10">
                  <h3 className="display-sm">{unit.name}</h3>
                  <p className="mt-4 max-w-[44ch] text-[0.98rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
                    {unit.role}
                  </p>

                  <div className="mt-7">
                    <Label>What happens</Label>
                    <FlowChain steps={unit.flow} className="mt-3.5" />
                  </div>

                  <div className="mt-7 border-t border-[color:var(--color-hairline)] pt-5">
                    <Label>What your team decides</Label>
                    <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
                      {unit.oversight}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120} className="mt-14">
            <StartProjectLink variant="primary" focus="follow-up">
              Talk about my business
            </StartProjectLink>
          </Reveal>
        </div>
      </section>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: graph([breadcrumbSchema(crumbs)]) }}
      />
    </>
  );
}
