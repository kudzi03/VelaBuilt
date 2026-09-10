/**
 * The three commercial offers.
 *
 * Capabilities (websites / automation / AI) are *how*. These are *what a
 * business buys*, expressed as the problem the buyer already recognises.
 * Each entry drives: the homepage chapter, the service page, the sitemap,
 * internal links and Service structured data.
 */

export type ServiceSlug =
  | "website-conversion-systems"
  | "lead-follow-up-systems"
  | "website-engine-optimization";

export interface ServiceStep {
  readonly title: string;
  readonly body: string;
}

export interface Service {
  readonly slug: ServiceSlug;
  readonly index: string;
  /** Commercial name of the offer. */
  readonly name: string;
  /** Short form used in navigation and cards. */
  readonly shortName: string;
  /** Answer-first summary. Used for meta description and AI answers. */
  readonly summary: string;
  /** Who this is for, in the buyer's own terms. */
  readonly audience: string;
  /** Problems the buyer recognises before they know any terminology. */
  readonly problems: readonly string[];
  /** What we actually do. Secondary to the problem. */
  readonly capabilities: readonly string[];
  /** The engagement, start to finish. */
  readonly process: readonly ServiceStep[];
  /** Page headline. */
  readonly headline: readonly [string, string];
  readonly proposition: string;
  readonly cta: string;
  /** Honest boundary — what this offer is not. */
  readonly boundary: string;
}

export const services: readonly Service[] = [
  {
    slug: "website-conversion-systems",
    index: "01",
    name: "Website Conversion System",
    shortName: "Website Conversion",
    summary:
      "A premium website rebuilt around trust and enquiry: positioning, design, user experience, performance and the conversion path from first visit to first contact.",
    audience:
      "Businesses whose website no longer reflects the quality of the work, or leaves visitors unsure what to do next.",
    problems: [
      "The website looks smaller than the business actually is.",
      "Visitors read the whole page and still cannot tell what you do.",
      "There is no obvious next step, so people leave to think about it.",
      "It was built for a different stage of the business.",
      "It is slow, awkward on a phone, or quietly broken.",
    ],
    capabilities: [
      "Positioning & message architecture",
      "User experience",
      "Visual design",
      "Front-end development",
      "Conversion architecture",
      "Mobile experience",
      "Performance engineering",
      "Analytics & measurement",
    ],
    process: [
      {
        title: "Read the current site",
        body: "We go through the site as a buyer would — where attention holds, where it drops, what a visitor cannot answer, what the site fails to say about the business.",
      },
      {
        title: "Fix the argument first",
        body: "Before design: what the business does, who it is for, why it can be trusted, and what happens next. Structure decided before surface.",
      },
      {
        title: "Design and build",
        body: "A considered interface, built properly — semantic markup, real performance work, and a mobile experience designed rather than inherited.",
      },
      {
        title: "Instrument and hand over",
        body: "Analytics, enquiry tracking and documentation, so you can see what the site is doing after we leave.",
      },
    ],
    headline: ["Your business already has value.", "The website should look like it."],
    proposition:
      "We design premium digital experiences that make a business easier to trust, understand and contact.",
    cta: "Show me what you'd change",
    boundary:
      "This is a build, not a monthly retainer. If the site is fundamentally sound and only needs discoverability work, we will say so.",
  },
  {
    slug: "lead-follow-up-systems",
    index: "02",
    name: "Lead Follow-Up & Recovery System",
    shortName: "Lead Follow-Up",
    summary:
      "Infrastructure that catches every enquiry, qualifies it, follows it up on a schedule, and puts the right conversations in the calendar — without anyone remembering to.",
    audience:
      "Businesses already receiving enquiries, quote requests or estimates that lose opportunities to inconsistent follow-up.",
    problems: [
      "Enquiries arrive, and then depend on somebody remembering.",
      "Quotes and estimates go out and are never chased.",
      "The details live in an inbox, a phone, a notebook and a spreadsheet.",
      "Nobody can say how many opportunities are open right now.",
      "Good leads go cold while you are on site, on a job, or with a client.",
    ],
    capabilities: [
      "Enquiry capture",
      "CRM structure",
      "Qualification & scoring",
      "Email & messaging follow-up",
      "Reminders & escalation",
      "Booking & calendar",
      "Pipeline visibility",
      "AI assistance with human oversight",
    ],
    process: [
      {
        title: "Map what happens now",
        body: "Every route an enquiry can take into the business, and every point it can stop. Usually the leak is not where people expect.",
      },
      {
        title: "Design the path",
        body: "One agreed route from enquiry to booked conversation, including what happens on day one, day three and day ten if nobody replies.",
      },
      {
        title: "Build it",
        body: "Capture, records, qualification, follow-up sequences, reminders and booking — connected, tested against real scenarios, and quiet when it should be.",
      },
      {
        title: "Hand over the controls",
        body: "You see the pipeline, you can change the messages, and the system tells you when a person needs to step in.",
      },
    ],
    headline: ["You got the lead.", "What happened next?"],
    proposition:
      "Good enquiries should not depend on somebody remembering what happens next.",
    cta: "Map my follow-up",
    boundary:
      "Automation does not repair a weak offer or replace judgement. Where a human should decide, the system escalates rather than guesses.",
  },
  {
    slug: "website-engine-optimization",
    index: "03",
    name: "Website Engine Optimization",
    shortName: "Discoverability",
    summary:
      "Technical foundations and information architecture that make a business straightforward for people, search engines and AI systems to find, read and describe correctly.",
    audience:
      "Businesses that are hard to find, or that get described inaccurately when they are found.",
    problems: [
      "Customers who already know the name still struggle to find you.",
      "The right pages are not indexed, or are indexed badly.",
      "The site does not answer the questions people actually search for.",
      "AI assistants describe the business inaccurately, or not at all.",
      "Nothing is measured, so nobody knows what is working.",
    ],
    capabilities: [
      "Technical SEO",
      "Information architecture",
      "Structured data",
      "Local discoverability",
      "Indexability & crawl health",
      "Performance",
      "Content structure",
      "Measurement",
    ],
    process: [
      {
        title: "Establish the facts",
        body: "What is indexed, what is not, what the site technically communicates, and how the business is currently described elsewhere.",
      },
      {
        title: "Fix the foundations",
        body: "Crawlability, structure, speed, metadata and structured data — the things that must be right before content can carry weight.",
      },
      {
        title: "Structure the answers",
        body: "Pages built to answer real questions clearly, so both a person and an answer engine can extract a correct response.",
      },
      {
        title: "Measure honestly",
        body: "Reporting on what actually changed. No vanity ranking screenshots for terms nobody searches.",
      },
    ],
    headline: ["Being good isn't enough", "if nobody can find — or understand — you."],
    proposition:
      "Technical foundations and information architecture that help people, search engines and AI systems understand what the business does.",
    cta: "Check my discoverability",
    boundary:
      "No rankings are guaranteed, and we do not buy links. This is engineering and structure, not manipulation.",
  },
] as const;

export function getService(slug: ServiceSlug): Service {
  const found = services.find((service) => service.slug === slug);
  if (!found) throw new Error(`Unknown service: ${slug}`);
  return found;
}
