/**
 * WHAT VELABUILT BUILDS — the single source of truth.
 *
 * Four capability areas, plus discoverability as the foundation under the
 * first. Each entry drives: its homepage chapter, its page, the sitemap,
 * internal links, Service structured data, the voice agent's enumerated
 * tools (`focus_service`, `show_capability`) and /llms.txt.
 *
 * Slugs predate the current naming and are kept deliberately: they are
 * already linked and indexed, and a clean URL is not worth a broken one.
 */

export type ServiceSlug =
  | "website-conversion-systems"
  | "ai-systems"
  | "lead-follow-up-systems"
  | "business-systems"
  | "website-engine-optimization";

/** The areas the site and the agent speak in. */
export type AreaId = "digital" | "ai" | "automation" | "systems" | "discover";

export interface ServiceStep {
  readonly title: string;
  readonly body: string;
}

export interface Capability {
  /** Stable id. The voice agent's show_capability tool is limited to these. */
  readonly id: string;
  readonly name: string;
  readonly body: string;
}

export interface Service {
  readonly slug: ServiceSlug;
  readonly area: AreaId;
  readonly index: string;
  /** Commercial name. */
  readonly name: string;
  /** Short form for navigation and cards. */
  readonly shortName: string;
  /** The object's chapter on this service's page. */
  readonly chapter: string;
  /** Answer-first summary: meta description, schema, AI answers. */
  readonly summary: string;
  readonly audience: string;
  /** Homepage chapter heading. */
  readonly chapterHeading: string;
  /** Homepage chapter body. */
  readonly chapterBody: string;
  /** The capability cards. */
  readonly items: readonly Capability[];
  /** Problems the buyer recognises before any terminology. */
  readonly problems: readonly string[];
  /** Plain capability names, for schema and the page's full list. */
  readonly capabilities: readonly string[];
  readonly process: readonly ServiceStep[];
  readonly headline: readonly [string, string];
  readonly proposition: string;
  readonly cta: string;
  /** Honest boundary — what this is not. */
  readonly boundary: string;
}

export const services: readonly Service[] = [
  {
    slug: "website-conversion-systems",
    area: "digital",
    index: "01",
    name: "Websites",
    shortName: "Websites",
    chapter: "page-digital",
    summary:
      "Websites that show the quality of your business, explain what you do and make it easy for visitors to get in touch.",
    audience:
      "Businesses whose website no longer reflects the quality of the work, or leaves visitors unsure what to do next.",
    chapterHeading: "A website that makes the next step clear.",
    chapterBody:
      "We make it clear what you offer, who it is for and how to contact you. Then we build a site that looks the part, loads quickly and works well on a phone.",
    items: [
      {
        id: "premium-websites",
        name: "A website that fits your business",
        body: "Clear words and considered design for a business that has outgrown its site.",
      },
      {
        id: "interactive-3d",
        name: "Memorable experiences",
        body: "Interactive details that help visitors explore and remember what you offer.",
      },
      {
        id: "conversion",
        name: "A clear path to contact",
        body: "Visitors can find the right information and know exactly how to get in touch.",
      },
      {
        id: "discoverability",
        name: "Easier to find online",
        body: "Pages organised so people and search tools can understand your business.",
      },
    ],
    problems: [
      "The website looks smaller than the business actually is.",
      "Visitors read the whole page and still cannot tell what you do.",
      "There is no obvious next step, so people leave to think about it.",
      "It was built for a different stage of the business.",
      "It is slow, awkward on a phone, or quietly broken.",
    ],
    capabilities: [
      "Clear message and page structure",
      "Easy-to-use pages",
      "Visual design",
      "Website development",
      "Interactive experiences",
      "Clear contact paths",
      "Fast loading",
      "Accessible design",
      "Visitor and enquiry tracking",
    ],
    process: [
      {
        title: "Read the current site",
        body: "We go through it as a buyer would — where attention holds, where it drops, what a visitor still cannot answer.",
      },
      {
        title: "Make the message clear",
        body: "We agree on what you do, who you help, why people should trust you and what they should do next.",
      },
      {
        title: "Design and build",
        body: "We build a site that looks right for your business, loads quickly and is easy to use on a phone.",
      },
      {
        title: "Show you how it works",
        body: "We set up visitor and enquiry tracking, then show you how to use the site after launch.",
      },
    ],
    headline: ["Your business does good work.", "Your website should show it."],
    proposition:
      "Websites and interactive experiences that make a business easier to trust, understand and contact.",
    cta: "Start a website project",
    boundary:
      "If your current site only needs a few changes, we will say so. You do not need to pay for a full rebuild without a good reason.",
  },
  {
    slug: "ai-systems",
    area: "ai",
    index: "02",
    name: "AI Assistants",
    shortName: "AI Assistants",
    chapter: "page-ai",
    summary:
      "AI assistants that use your business information to answer common questions and help with repeat tasks, while your team stays in charge of important decisions.",
    audience:
      "Businesses answering the same questions, reading the same documents or handling the same requests by hand, every day.",
    chapterHeading: "Answer common questions without keeping people waiting.",
    chapterBody:
      "An AI assistant can answer by voice or chat using information you approve. When it does not know, or a decision needs a person, it hands over to your team.",
    items: [
      {
        id: "ai-agents",
        name: "Answers by voice or chat",
        body: "Common questions answered using information you provide, with no guessing when the answer is missing.",
      },
      {
        id: "ai-workflows",
        name: "Help with repeat work",
        body: "Sort enquiries, draft replies and summarise documents, with a person checking important work.",
      },
      {
        id: "intelligent-interfaces",
        name: "Help finding the right answer",
        body: "Make it easier for customers to find the information or next step they need.",
      },
    ],
    problems: [
      "The same questions arrive every day and someone answers each one by hand.",
      "Enquiries sit unread because nobody has time to sort them.",
      "Information lives in documents nobody can search quickly.",
      "Out of hours, nobody answers at all.",
    ],
    capabilities: [
      "Voice assistants",
      "Chat assistants",
      "Answers based on your information",
      "Connections to your existing tools",
      "Sorting incoming enquiries",
      "Drafting and summarising",
      "Review and handover to your team",
    ],
    process: [
      {
        title: "Find the repeated work",
        body: "Which questions, documents and decisions recur — and which of them should never be automated.",
      },
      {
        title: "Agree on what it can do",
        body: "We use information you approve and agree on the actions the assistant is allowed to take.",
      },
      {
        title: "Build and test against reality",
        body: "We test everyday questions, difficult questions and situations where it must ask a person instead.",
      },
      {
        title: "Hand over the controls",
        body: "You can see what it said, change what it knows, and switch it off.",
      },
    ],
    headline: ["Answers at any hour.", "Judgment stays with you."],
    proposition:
      "Helpful answers based on your business information, with your team in charge of important decisions.",
    cta: "Talk about an AI assistant",
    boundary:
      "An assistant should not guess. It will not make up prices, promises or answers you have not approved.",
  },
  {
    slug: "lead-follow-up-systems",
    area: "automation",
    index: "03",
    name: "Follow-Up",
    shortName: "Follow-Up",
    chapter: "page-automation",
    summary:
      "Tools that keep enquiries and quotes from being forgotten, send timely follow-ups and show your team what needs attention.",
    audience:
      "Businesses already receiving enquiries, quote requests or estimates that lose opportunities to inconsistent follow-up or repeated manual work.",
    chapterHeading: "Follow-up that doesn’t depend on anyone remembering.",
    chapterBody:
      "Keep every enquiry in one place, remind people at the right time and see which conversations still need a reply. Your team steps in when a personal decision is needed.",
    items: [
      {
        id: "lead-workflows",
        name: "Enquiries in one place",
        body: "Bring messages from different places together so nothing is overlooked.",
      },
      {
        id: "follow-up",
        name: "Timely follow-up",
        body: "Send a short series of helpful messages in your voice, and stop when someone replies.",
      },
      {
        id: "crm-automation",
        name: "Up-to-date records",
        body: "Keep customer details and reminders current as conversations move forward.",
      },
      {
        id: "operational-automation",
        name: "Less repeated admin",
        body: "Let software handle routine copying and reminders, with your team checking the work.",
      },
    ],
    problems: [
      "Enquiries arrive, and then depend on somebody remembering.",
      "Quotes and estimates go out and are never chased.",
      "The details live in an inbox, a phone, a notebook and a spreadsheet.",
      "Nobody can say how many opportunities are open right now.",
      "Good leads go cold while you are on site, on a job, or with a client.",
    ],
    capabilities: [
      "Collecting enquiries",
      "Sorting enquiries by need",
      "Email and message follow-up",
      "Reminders and handover",
      "Bookings and calendars",
      "Keeping customer records up to date",
      "Reducing repeated admin",
      "AI help with team review",
    ],
    process: [
      {
        title: "Map what happens now",
        body: "Every route an enquiry can take into the business, and every point it can stop. The leak is rarely where people expect.",
      },
      {
        title: "Design the path",
        body: "One agreed route from enquiry to booked conversation, including what happens when nobody replies.",
      },
      {
        title: "Build it",
        body: "We connect enquiries, records, reminders and booking, then test them against real situations.",
      },
      {
        title: "Hand over the controls",
        body: "You can see what is still open, change the messages and tell when someone on your team needs to step in.",
      },
    ],
    headline: ["Someone got in touch.", "What happened next?"],
    proposition: "Good enquiries should not depend on somebody remembering what happens next.",
    cta: "Improve my follow-up",
    boundary:
      "A tool cannot fix an offer customers do not want or make every decision for your team. It hands important choices to a person.",
  },
  {
    slug: "business-systems",
    area: "systems",
    index: "04",
    name: "Business Tools",
    shortName: "Business Tools",
    chapter: "page-systems",
    summary:
      "Practical tools for keeping customer details, enquiries, jobs and key numbers together, built around the way your business works.",
    audience:
      "Businesses running on spreadsheets, inboxes and memory, or on software that was set up once and never fitted.",
    chapterHeading: "Keep the work in one place.",
    chapterBody:
      "See who contacted you, what happens next and which jobs need attention. We can improve the tools you already use or build something that fits better.",
    items: [
      {
        id: "crm-systems",
        name: "Customer records",
        body: "Keep customer details and open opportunities in a place your team can actually use.",
      },
      {
        id: "enquiry-systems",
        name: "Clear ownership",
        body: "Give every new enquiry a record, a next step and someone responsible for it.",
      },
      {
        id: "dashboards",
        name: "Key numbers in one view",
        body: "See the figures you need without spending an afternoon on spreadsheets.",
      },
      {
        id: "workflow-infrastructure",
        name: "Tools that work together",
        body: "Connect the software you use so your team does not enter the same details twice.",
      },
    ],
    problems: [
      "Nobody trusts the customer records, so nobody uses them.",
      "The same information is typed into three places.",
      "Reporting means an afternoon in a spreadsheet.",
      "The software was chosen before anyone mapped the work.",
    ],
    capabilities: [
      "Customer record systems (CRMs)",
      "Enquiry tracking",
      "Views of key business numbers",
      "Connecting existing tools",
      "Clear steps for routine work",
      "Training and handover",
    ],
    process: [
      {
        title: "Understand how work moves",
        body: "How work actually arrives, moves and finishes — before anyone chooses software.",
      },
      {
        title: "Choose the right tool",
        body: "An existing tool configured well is often the right answer. We say so when it is.",
      },
      {
        title: "Set it up and move your records",
        body: "We connect the parts and move existing records carefully so your team can keep working.",
      },
      {
        title: "Hand over",
        body: "We explain how it works and train your team, so the tools belong to your business.",
      },
    ],
    headline: ["Your business already has a system.", "It just lives in people’s heads."],
    proposition:
      "Tools that make it easier to track customers, jobs and the numbers that matter.",
    cta: "Talk about better business tools",
    boundary:
      "We will not replace software that already works. If it only needs setting up properly, we will say so.",
  },
  {
    slug: "website-engine-optimization",
    area: "discover",
    index: "05",
    name: "Get Found Online",
    shortName: "Get Found Online",
    chapter: "page-discover",
    summary:
      "Help customers find your business online and understand what you offer when they do.",
    audience:
      "Businesses that are hard to find, or that get described inaccurately when they are found.",
    chapterHeading: "Make it easier for the right people to find you.",
    chapterBody:
      "We make your pages easier to find and clearer to read, so search engines and AI tools can describe your business accurately.",
    items: [
      {
        id: "technical-seo",
        name: "Search-ready pages",
        body: "Help search engines find and understand the pages that matter.",
      },
      {
        id: "structured-data",
        name: "Accurate business details",
        body: "Give search tools clear, consistent facts about your business and services.",
      },
      {
        id: "answer-structure",
        name: "Helpful answers",
        body: "Answer the questions customers actually ask in clear language.",
      },
    ],
    problems: [
      "Customers who already know the name still struggle to find you.",
      "Some important pages do not show up in search.",
      "The site does not answer the questions people actually search for.",
      "AI assistants describe the business inaccurately, or not at all.",
    ],
    capabilities: [
      "Search engine optimisation (SEO)",
      "Clear page structure",
      "Consistent business information",
      "Local search presence",
      "Pages search engines can find",
      "Fast loading",
      "Tracking what changes",
    ],
    process: [
      {
        title: "Establish the facts",
        body: "We check which pages search engines can find and how your business is described online.",
      },
      {
        title: "Fix the foundations",
        body: "We fix issues that stop search tools finding, loading or understanding your pages.",
      },
      {
        title: "Structure the answers",
        body: "Pages built to answer real questions clearly.",
      },
      {
        title: "Measure honestly",
        body: "We show what changed and what the numbers actually say.",
      },
    ],
    headline: ["Being good isn’t enough", "if nobody can find — or understand — you."],
    proposition:
      "Clear pages that help people and search tools understand what your business does.",
    cta: "Help customers find me",
    boundary:
      "Nobody can honestly promise a top search ranking. We improve the site itself and show you what changed.",
  },
] as const;

/** The four areas that make up the homepage journey, in order. */
export const primaryServices = services.filter((s) => s.area !== "discover");

export function getService(slug: ServiceSlug): Service {
  const found = services.find((service) => service.slug === slug);
  if (!found) throw new Error(`Unknown service: ${slug}`);
  return found;
}

export function serviceForArea(area: AreaId): Service {
  const found = services.find((service) => service.area === area);
  if (!found) throw new Error(`Unknown area: ${area}`);
  return found;
}

/** Every capability id, with the area it belongs to. */
export const CAPABILITIES = services.flatMap((s) =>
  s.items.map((item) => ({ ...item, area: s.area, slug: s.slug })),
);
