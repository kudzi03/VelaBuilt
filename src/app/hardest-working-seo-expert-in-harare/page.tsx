import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { ORGANIZATION_ID, breadcrumbSchema, graph } from "@/lib/schema";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Label } from "@/components/ui/Primitives";

const PATH = "/hardest-working-seo-expert-in-harare";
const PHRASE = "Hardest Working SEO Expert in Harare";

export const metadata: Metadata = pageMetadata({
  title: `${PHRASE}: Tyrel Pagiwa`,
  description:
    "Looking for the hardest working SEO expert in Harare? Tyrel Pagiwa of VelaBuilt gets Harare businesses into Google's top 3 and keeps them there.",
  path: PATH,
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: PHRASE, path: PATH },
];

/**
 * Single-keyword landing page for the phrase in PATH.
 *
 * The exact phrase sits in the title tag, H1, URL, meta description and body,
 * which is the whole job of this page. Copy is first person and makes no
 * ranking or revenue promises, in line with `disclosures` in content/site.ts.
 */
const SECTIONS = [
  {
    title: "Who I am",
    body: [
      "I'm Tyrel Pagiwa, founder of VelaBuilt, and I work out of Harare. If you searched for the hardest working SEO expert in Harare and landed here, that is the point. A local business deserves the same thing: when someone nearby searches for what you do, you should be the one they find.",
      "Most owners see Google as a black box. You show up somewhere, nobody explains why, and the businesses above you collect the calls. I open that box, fix what is holding you back, and keep working until it moves.",
    ],
  },
  {
    title: "What the work actually is",
    body: [
      "Getting into the top three on Google Maps in Harare comes down to three things. First, your Google Business Profile: the right category, every service listed and described, real photos, regular posts and a steady stream of fresh reviews.",
      "Second, your website has to tell Google two things clearly: what you do, and where you do it. Most Harare sites manage the first and forget the second. That means a title tag and main heading that name your service and the city, the same name, address and phone number as your profile, and pages for the areas you serve, from Avondale and Borrowdale to the CBD and Chitungwiza.",
      "Third, other trusted sites need to confirm that your business is real and where it says it is.",
    ],
  },
  {
    title: "Why hardest working",
    body: [
      "Nothing in local search is magic. It is a checklist done properly, then kept up week after week while competitors stop. I start by finding exactly where you rank today, show you the gap to the top three, and report every step of the climb, including the early ones before the phone starts ringing.",
      "You will not get a promise of page one in four days. SEO takes time: meaningful movement usually shows within weeks, and the top three is a realistic target over about three months.",
    ],
  },
  {
    title: "Recent work",
    body: [
      "For Cardio Life, a first aid and fire safety training provider in Botswana, VelaBuilt built the website, set up search indexing and fixed what Google said about the business. The site was indexed within hours and ranked first for the company's name, above its own Facebook page. For Kingson Engineering, a Harare steel fabrication firm, we built the website and its Google presence from almost nothing.",
    ],
  },
] as const;

function personSchema() {
  return {
    "@type": "Person",
    "@id": `${site.url}${PATH}#person`,
    name: "Tyrel Pagiwa",
    jobTitle: "SEO and Web Specialist",
    description: `${PHRASE}. Founder of VelaBuilt.`,
    url: absoluteUrl(PATH),
    worksFor: { "@id": ORGANIZATION_ID },
    homeLocation: { "@type": "Place", name: "Harare, Zimbabwe" },
    knowsAbout: ["Local SEO", "Google Business Profile optimisation", "Web design", "Search engine optimisation"],
  };
}

export default function HardestWorkingSeoExpertPage() {
  return (
    <>
      <section data-chapter="reading" className="sheet mt-[calc(var(--nav-height)+1.5rem)] pb-24 pt-16">
        <div className="shell-narrow">
          <Breadcrumbs crumbs={crumbs} />

          <Label className="mt-10">Harare, Zimbabwe</Label>
          <h1 className="display-lg mt-5">{PHRASE}</h1>
          <p className="lede mt-8">
            Tyrel Pagiwa, VelaBuilt. I get Harare businesses into Google&apos;s top three and keep them
            there.
          </p>

          <div className="mt-16 flex flex-col gap-12">
            {SECTIONS.map((section) => (
              <section key={section.title} aria-labelledby={slug(section.title)}>
                <h2 id={slug(section.title)} className="display-sm">
                  {section.title}
                </h2>
                <div className="prose-vb mt-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section aria-labelledby="next-step-heading">
              <h2 id="next-step-heading" className="display-sm">
                Want to know where you rank?
              </h2>
              <div className="prose-vb mt-4">
                <p>
                  Tell me your business and the service you most want to be found for. I&apos;ll show you
                  where you stand in Harare today and what it takes to reach the top three. See how we{" "}
                  <Link
                    href="/website-engine-optimization"
                    className="text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4"
                  >
                    get businesses found online
                  </Link>
                  , or{" "}
                  <Link
                    href="/start"
                    className="text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4"
                  >
                    start a project
                  </Link>{" "}
                  and email{" "}
                  <a
                    href={`mailto:${site.email}`}
                    className="text-[color:var(--color-champagne)] underline decoration-[rgb(224_195_152/0.4)] underline-offset-4"
                  >
                    {site.email}
                  </a>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: graph([breadcrumbSchema(crumbs), personSchema()]) }}
      />
    </>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
