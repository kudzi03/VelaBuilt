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
    name: "Digital Experiences",
    shortName: "Websites",
    chapter: "page-digital",
    summary:
      "Premium websites and interactive digital experiences — positioning, design, engineering and the path from first visit to enquiry — built fast, accessible and measurable.",
    audience:
      "Businesses whose website no longer reflects the quality of the work, or leaves visitors unsure what to do next.",
    chapterHeading: "Websites with the weight of the business behind them.",
    chapterBody:
      "We settle what the business is saying before designing how it looks, then engineer it properly: semantic, fast, accessible, and interactive only where interaction carries meaning. The page you are on is one.",
    items: [
      {
        id: "premium-websites",
        name: "Premium websites",
        body: "Positioning, design and build for businesses that have outgrown their site.",
      },
      {
        id: "interactive-3d",
        name: "Interactive & 3D",
        body: "Real-time WebGL, scroll choreography and spatial interfaces, engineered to load quickly.",
      },
      {
        id: "conversion",
        name: "Conversion architecture",
        body: "One clear path from first visit to enquiry, instrumented so you can see it working.",
      },
      {
        id: "discoverability",
        name: "Discoverability",
        body: "Structure and structured data that search engines and AI assistants can read correctly.",
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
      "Positioning & message architecture",
      "User experience",
      "Visual design",
      "Front-end engineering",
      "Interactive & WebGL experiences",
      "Conversion architecture",
      "Performance engineering",
      "Accessibility",
      "Analytics & measurement",
    ],
    process: [
      {
        title: "Read the current site",
        body: "We go through it as a buyer would — where attention holds, where it drops, what a visitor still cannot answer.",
      },
      {
        title: "Fix the argument first",
        body: "What the business does, who it is for, why it can be trusted and what happens next. Structure decided before surface.",
      },
      {
        title: "Design and build",
        body: "A considered interface, built properly — semantic markup, real performance work, and a phone experience designed rather than inherited.",
      },
      {
        title: "Instrument and hand over",
        body: "Analytics, enquiry tracking and documentation, so you can see what the site is doing after launch.",
      },
    ],
    headline: ["Your business already has weight.", "The website should carry it."],
    proposition:
      "Websites and interactive experiences that make a business easier to trust, understand and contact.",
    cta: "Start a website project",
    boundary:
      "This is a build, not a monthly retainer. If the site is fundamentally sound and only needs targeted work, we will say so.",
  },
  {
    slug: "ai-systems",
    area: "ai",
    index: "02",
    name: "AI Systems",
    shortName: "AI Systems",
    chapter: "page-ai",
    summary:
      "AI agents, AI-assisted workflows and intelligent interfaces — grounded in a business’s own information, given defined tools, and designed so a person stays in charge of what matters.",
    audience:
      "Businesses answering the same questions, reading the same documents or handling the same requests by hand, every day.",
    chapterHeading: "Agents that answer, and know when to hand over.",
    chapterBody:
      "Voice and chat agents that answer from your own information, act through tools you define, and escalate to a person when judgment is needed. Vela, the voice on this site, is one of them.",
    items: [
      {
        id: "ai-agents",
        name: "AI agents",
        body: "Voice and chat agents that answer from a defined knowledge base and say so when they do not know.",
      },
      {
        id: "ai-workflows",
        name: "AI-assisted workflows",
        body: "Reading, sorting, drafting and summarising — with a person reviewing anything that commits the business.",
      },
      {
        id: "intelligent-interfaces",
        name: "Intelligent interfaces",
        body: "Interfaces that respond to what a person is asking. This site’s guide can move you through it.",
      },
    ],
    problems: [
      "The same questions arrive every day and someone answers each one by hand.",
      "Enquiries sit unread because nobody has time to sort them.",
      "Information lives in documents nobody can search quickly.",
      "Out of hours, nobody answers at all.",
    ],
    capabilities: [
      "Voice agents",
      "Chat agents",
      "Knowledge grounding",
      "Tool and system integration",
      "Enquiry classification",
      "Drafting and summarisation",
      "Human review and escalation",
    ],
    process: [
      {
        title: "Find the repeated work",
        body: "Which questions, documents and decisions recur — and which of them should never be automated.",
      },
      {
        title: "Ground it",
        body: "An explicit knowledge base and a short list of actions the agent may take. Nothing outside it.",
      },
      {
        title: "Build and test against reality",
        body: "Real questions, awkward questions, and questions it must refuse. Tested before anyone relies on it.",
      },
      {
        title: "Hand over the controls",
        body: "You can see what it said, change what it knows, and switch it off.",
      },
    ],
    headline: ["Answers at any hour.", "Judgment stays with you."],
    proposition:
      "AI systems grounded in the business’s own information, with defined tools and human oversight built in.",
    cta: "Discuss an AI system",
    boundary:
      "An agent is only as good as what it is allowed to know. We do not build agents that improvise answers about prices, commitments or anything they have not been given.",
  },
  {
    slug: "lead-follow-up-systems",
    area: "automation",
    index: "03",
    name: "Automation",
    shortName: "Automation",
    chapter: "page-automation",
    summary:
      "Business automation that catches every enquiry, qualifies it, follows it up on a schedule, updates the CRM and books the right conversations — without anyone having to remember to.",
    audience:
      "Businesses already receiving enquiries, quote requests or estimates that lose opportunities to inconsistent follow-up or repeated manual work.",
    chapterHeading: "Follow-up that doesn’t depend on anyone remembering.",
    chapterBody:
      "Every enquiry captured, qualified and followed up on a schedule. Quotes chased. The right conversations booked. Records updated as it happens, and a person brought in the moment judgment is needed.",
    items: [
      {
        id: "lead-workflows",
        name: "Lead workflows",
        body: "Every route an enquiry can take into the business, captured into one record.",
      },
      {
        id: "follow-up",
        name: "Follow-up systems",
        body: "Day one, day three, day ten — sequenced, in your language, and stopped the moment someone replies.",
      },
      {
        id: "crm-automation",
        name: "CRM automation",
        body: "Records, stages and reminders that update themselves as the work moves.",
      },
      {
        id: "operational-automation",
        name: "Operational automation",
        body: "The repeated admin between tools — handed to software, checked by people.",
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
      "Enquiry capture",
      "Qualification",
      "Email & messaging follow-up",
      "Reminders & escalation",
      "Booking & calendar",
      "CRM automation",
      "Operational workflow automation",
      "AI assistance with human oversight",
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
        body: "Capture, records, qualification, sequences, reminders and booking — connected, tested against real scenarios, quiet when it should be.",
      },
      {
        title: "Hand over the controls",
        body: "You see the pipeline, you can change the messages, and the system tells you when a person needs to step in.",
      },
    ],
    headline: ["You got the lead.", "What happened next?"],
    proposition: "Good enquiries should not depend on somebody remembering what happens next.",
    cta: "Map my follow-up",
    boundary:
      "Automation does not repair a weak offer or replace judgment. Where a person should decide, the system escalates rather than guesses.",
  },
  {
    slug: "business-systems",
    area: "systems",
    index: "04",
    name: "Business Systems",
    shortName: "Business Systems",
    chapter: "page-systems",
    summary:
      "CRM systems, enquiry systems, internal dashboards and workflow infrastructure — designed around how the business actually runs, configured on the right platform or built to fit.",
    audience:
      "Businesses running on spreadsheets, inboxes and memory, or on software that was set up once and never fitted.",
    chapterHeading: "One place the operation actually lives.",
    chapterBody:
      "CRM, enquiry handling, dashboards and the workflow infrastructure underneath them — designed around how the business runs, not how a template assumes it does.",
    items: [
      {
        id: "crm-systems",
        name: "CRM systems",
        body: "Configured on the right platform or built to fit — with stages that match the real work.",
      },
      {
        id: "enquiry-systems",
        name: "Enquiry systems",
        body: "Forms, routing and records that turn an enquiry into work someone owns.",
      },
      {
        id: "dashboards",
        name: "Internal dashboards",
        body: "The numbers the business actually runs on, in one view, without assembling them by hand.",
      },
      {
        id: "workflow-infrastructure",
        name: "Workflow infrastructure",
        body: "The integrations and data paths that let the rest of it hold together.",
      },
    ],
    problems: [
      "Nobody trusts the CRM, so nobody uses it.",
      "The same information is typed into three places.",
      "Reporting means an afternoon in a spreadsheet.",
      "The software was chosen before anyone mapped the work.",
    ],
    capabilities: [
      "CRM configuration & builds",
      "Enquiry systems",
      "Internal dashboards",
      "Integrations & data flow",
      "Workflow infrastructure",
      "Documentation & handover",
    ],
    process: [
      {
        title: "Map the operation",
        body: "How work actually arrives, moves and finishes — before anyone chooses software.",
      },
      {
        title: "Choose the platform honestly",
        body: "An existing tool configured well is often the right answer. We say so when it is.",
      },
      {
        title: "Build and migrate",
        body: "Structure, integrations, dashboards and the move from what exists now — without losing records.",
      },
      {
        title: "Hand over",
        body: "Documentation and training, so the system belongs to the business rather than to us.",
      },
    ],
    headline: ["Your business already has a system.", "It just lives in people’s heads."],
    proposition:
      "Operational systems designed around how the business actually runs.",
    cta: "Discuss a business system",
    boundary:
      "We will not rebuild something that works. If an existing platform only needs configuring, that is the recommendation.",
  },
  {
    slug: "website-engine-optimization",
    area: "discover",
    index: "05",
    name: "Discoverability",
    shortName: "Discoverability",
    chapter: "page-discover",
    summary:
      "Technical foundations and information architecture that make a business straightforward for people, search engines and AI systems to find, read and describe correctly.",
    audience:
      "Businesses that are hard to find, or that get described inaccurately when they are found.",
    chapterHeading: "Found, and described correctly.",
    chapterBody:
      "Crawlable structure, fast pages and structured data, so people, search engines and AI assistants can say accurately what the business does.",
    items: [
      {
        id: "technical-seo",
        name: "Technical SEO",
        body: "Crawlability, indexing, performance and metadata — the foundations content depends on.",
      },
      {
        id: "structured-data",
        name: "Structured data",
        body: "A consistent, machine-readable description of the business and what it offers.",
      },
      {
        id: "answer-structure",
        name: "Answer structure",
        body: "Pages that answer real questions clearly enough for a person and an answer engine alike.",
      },
    ],
    problems: [
      "Customers who already know the name still struggle to find you.",
      "The right pages are not indexed, or are indexed badly.",
      "The site does not answer the questions people actually search for.",
      "AI assistants describe the business inaccurately, or not at all.",
    ],
    capabilities: [
      "Technical SEO",
      "Information architecture",
      "Structured data",
      "Local discoverability",
      "Indexability & crawl health",
      "Performance",
      "Measurement",
    ],
    process: [
      {
        title: "Establish the facts",
        body: "What is indexed, what is not, and how the business is currently described elsewhere.",
      },
      {
        title: "Fix the foundations",
        body: "Crawlability, structure, speed, metadata and structured data.",
      },
      {
        title: "Structure the answers",
        body: "Pages built to answer real questions clearly.",
      },
      {
        title: "Measure honestly",
        body: "Reporting on what actually changed. No vanity screenshots.",
      },
    ],
    headline: ["Being good isn’t enough", "if nobody can find — or understand — you."],
    proposition:
      "Foundations that help people, search engines and AI systems understand what the business does.",
    cta: "Check my discoverability",
    boundary:
      "No rankings are guaranteed, and we do not buy links. This is engineering and structure, not manipulation.",
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
