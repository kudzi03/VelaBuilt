import type { Metadata } from "next";
import { systemModules } from "@/content/systems";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { SystemLabRoom } from "@/components/lab/SystemLabRoom";
import { SignalStill } from "@/components/signal/SignalStill";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FlowChain } from "@/components/ui/FlowChain";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryBadge, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "System Lab",
  description:
    "Interactive demonstrations of the systems VelaBuilt builds: CRM, booking, follow-up, messaging, pipeline, AI assistance and analytics — and how each one hands off to the next.",
  path: "/system-lab",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "System Lab", path: "/system-lab" },
];

export default function SystemLabPage() {
  return (
    <>
      {/* The world: the middle of the system, taken apart. */}
      <SignalStill parked={0.5} />

      <section className="relative overflow-hidden pb-20 pt-[calc(var(--nav-height)+5rem)]">

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <CategoryBadge tone="champagne">Interactive system demonstrations</CategoryBadge>
            <h1 className="display-xl mt-6 max-w-[14ch]">
              The room where the parts <span className="foil">meet.</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[54ch]">
              Businesses are sold tools and left to work out how they relate. This
              is the map: what each system does, what it hands off to, and what a
              person still decides.
            </p>
            <p className="mt-6 max-w-[54ch] text-sm text-[color:var(--color-faint)]">
              Structure only. No customer records, no sample dashboards presented
              as real data, no numbers we cannot evidence.
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="lab-heading" className="relative pb-24">
        <div className="shell">
          <h2 id="lab-heading" className="sr-only">
            System modules
          </h2>
          <SystemLabRoom drivesBackdrop />
        </div>
      </section>

      {/* Every module written out, so the page is complete without interaction. */}
      <section aria-labelledby="reference-heading" className="relative py-24 lg:py-28">
        <div className="shell">
          <Reveal>
            <Label tone="champagne">Reference</Label>
            <h2 id="reference-heading" className="display-lg mt-5 max-w-[18ch]">
              Every module, in full.
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
                    <Label>Sequence</Label>
                    <FlowChain steps={unit.flow} className="mt-3.5" />
                  </div>

                  <div className="mt-7 border-t border-[color:var(--color-hairline)] pt-5">
                    <Label>Human oversight</Label>
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
              Map this onto my business
            </StartProjectLink>
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
