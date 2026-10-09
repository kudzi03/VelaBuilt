/**
 * WORK — three strictly separated categories.
 *
 *   CLIENT WORK  — delivered, with the client's permission. Never populated
 *                  with anything unverified.
 *   CONCEPT      — a study. Explicitly not a delivered project.
 *   SYSTEM DEMO  — an interactive demonstration running on sample data.
 *
 * The site launches with concepts and demonstrations rather than invented
 * case studies. Category labels are rendered on every card and are not
 * cosmetic: they are the honesty contract.
 */

export type WorkCategory = "client-work" | "concept" | "system-demo";

export interface WorkCategoryMeta {
  readonly id: WorkCategory;
  readonly label: string;
  readonly definition: string;
}

export const workCategories: readonly WorkCategoryMeta[] = [
  {
    id: "client-work",
    label: "Client Work",
    definition:
      "Projects delivered for real businesses, published with their permission. Nothing appears here until it exists and the client has agreed to it.",
  },
  {
    id: "concept",
    label: "Concept",
    definition:
      "Studies exploring how a problem could be solved. Not a delivered project, and not presented as one.",
  },
  {
    id: "system-demo",
    label: "Working Example",
    definition:
      "Working examples of tools we build, using made-up customer details so you can try them safely.",
  },
] as const;

export interface WorkItem {
  readonly slug: string;
  readonly title: string;
  readonly category: WorkCategory;
  /** The buyer-recognised problem the piece addresses. */
  readonly problem: string;
  /** What was designed or built. */
  readonly response: string;
  readonly disciplines: readonly string[];
  /** Optional in-site destination — a demonstration, or a case study. */
  readonly href?: string;
  /** Sector and place, shown under the title. Client work only. */
  readonly context?: string;
  /** The delivered site, opened in a new tab. Client work only. */
  readonly liveUrl?: string;
  /** Overrides the card's default "Open the demonstration". */
  readonly linkLabel?: string;
  /**
   * Work delivered by the founder before the current VelaBuilt studio
   * identity existed. Stated on the card and in the case study rather than
   * quietly absorbed into the studio's record.
   */
  readonly priorToStudio?: boolean;
}

export const workItems: readonly WorkItem[] = [
  {
    slug: "cardio-life",
    title: "Cardio Life",
    category: "client-work",
    context: "Corporate training · Botswana",
    problem:
      "HR, procurement and safety teams have to work out which training is required, satisfy themselves that the provider is genuinely accredited, and get to a quotation.",
    response:
      "A website that clearly shows Cardio Life’s courses and accreditation, so a potential customer can find the right training and ask for a quote.",
    disciplines: [
      "Website strategy",
      "Clear messaging",
      "Page structure",
      "Website design",
      "Development",
      "Mobile experience",
      "Quote requests",
    ],
    href: "/work/cardio-life",
    liveUrl: "https://www.cardiolife.co.bw/",
    linkLabel: "Read the case study",
    priorToStudio: true,
  },
  {
    slug: "follow-up-recovery-demo",
    title: "Follow-Up & Recovery",
    category: "system-demo",
    problem:
      "An inquiry arrives on a Friday afternoon and is remembered on Tuesday, if at all.",
    response:
      "A working example of what happens after someone gets in touch: their request is recorded, followed up and passed to a person when needed.",
    disciplines: ["Customer records", "Follow-up", "Booking", "AI help"],
    href: "/system-lab#follow-up",
  },
  {
    slug: "system-lab-demo",
    title: "See How It Works",
    category: "system-demo",
    problem:
      "Business owners are sold tools, then left to work out how the tools relate to each other.",
    response:
      "An interactive example showing how customer details, follow-up and booking can work together, and where your team stays in charge.",
    disciplines: ["Connected tools", "Interactive example", "Clear instructions"],
    href: "/system-lab",
  },
  {
    slug: "ember-and-grain",
    title: "Ember & Grain",
    category: "concept",
    problem: "A restaurant needs more than a beautiful first impression. It needs a clear path to a table.",
    response: "A fictional restaurant website where visitors can step inside, explore the menu and try a sample table request.",
    disciplines: ["Website design", "Development", "Booking journey"],
    href: "/demo/ember-and-grain",
    linkLabel: "Explore the concept",
  },
  {
    slug: "discoverability-concept",
    title: "Get Found and Understood",
    category: "concept",
    problem:
      "People search for a business, but the information they find is incomplete or wrong.",
    response:
      "A study of how clear pages and consistent business facts help both people and search tools understand what a company offers.",
    disciplines: ["Clear pages", "Consistent information", "Helpful answers"],
  },
] as const;

export function workByCategory(category: WorkCategory): readonly WorkItem[] {
  return workItems.filter((item) => item.category === category);
}
