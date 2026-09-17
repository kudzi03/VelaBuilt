import type { Metadata } from "next";
import { workByCategory, workCategories, workItems } from "@/content/work";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, graph } from "@/lib/schema";
import { PageBackdrop } from "@/components/cinematic/PageBackdrop";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { WorkGrid } from "@/components/work/WorkGrid";
import { Reveal } from "@/components/ui/Reveal";
import { Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "Concept studies and working system demonstrations from VelaBuilt, each labeled for what it is. Client work is published only when delivered and agreed.",
  path: "/work",
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Work", path: "/work" },
];

export default function WorkPage() {
  const clientWork = workByCategory("client-work");

  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-[calc(var(--nav-height)+5rem)]">
        <PageBackdrop plate="atrium" focal={[0.42, 0.5]} presence={0.4} />

        <div className="shell relative">
          <Breadcrumbs crumbs={crumbs} />

          <Reveal className="mt-10">
            <Label tone="champagne">Real ideas · Real systems · Real possibilities</Label>
            <h1 className="display-xl mt-6 max-w-[13ch]">
              Explore our <span className="foil">work.</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="lede mt-9 max-w-[54ch]">
              Every piece carries a label: client work delivered for a business,
              a concept study, or a working demonstration on sample data. The
              labels are the point.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Client work: honest about being empty until it isn't. */}
      <section aria-labelledby="client-heading" className="relative py-16">
        <div className="shell">
          <Reveal>
            <h2 id="client-heading" className="display-md">
              Client work
            </h2>
          </Reveal>

          {clientWork.length > 0 ? (
            <div className="mt-10">
              <WorkGrid items={clientWork} />
            </div>
          ) : (
            <Reveal delay={100}>
              <div className="reading-ground mt-10">
                <p className="max-w-[58ch] text-[1.05rem] leading-relaxed text-[color:var(--color-ivory-dim)]">
                  Client projects appear here once they are delivered and the
                  client has agreed to be named.
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section aria-labelledby="other-heading" className="relative py-16 pb-28">
        <div className="shell">
          <Reveal>
            <h2 id="other-heading" className="display-md">
              Concepts &amp; system demonstrations
            </h2>
          </Reveal>
          <div className="mt-10">
            <WorkGrid items={workItems.filter((item) => item.category !== "client-work")} />
          </div>

          <Reveal delay={140} className="mt-14">
            <StartProjectLink variant="primary">Start a project</StartProjectLink>
          </Reveal>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: graph([
            breadcrumbSchema(crumbs),
            {
              "@type": "CollectionPage",
              name: "Work — VelaBuilt",
              description:
                "Concept studies and system demonstrations, each labeled for what it is.",
              about: workCategories.map((category) => ({
                "@type": "Thing",
                name: category.label,
                description: category.definition,
              })),
            },
          ]),
        }}
      />
    </>
  );
}
