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
    label: "System Demo",
    definition:
      "Working demonstrations of systems we build, running on sample data. The mechanics are real; the records are not.",
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
  /** Optional in-site destination — a live demo, not a case study. */
  readonly href?: string;
}

export const workItems: readonly WorkItem[] = [
  {
    slug: "follow-up-recovery-demo",
    title: "Follow-Up & Recovery",
    category: "system-demo",
    problem:
      "An enquiry arrives on a Friday afternoon and is remembered on Tuesday, if at all.",
    response:
      "An interactive walkthrough of capture, qualification, sequenced follow-up, escalation and booking — with the point a person takes over made explicit.",
    disciplines: ["CRM", "Follow-up", "Booking", "AI assistance"],
    href: "/system-lab#follow-up",
  },
  {
    slug: "system-lab-demo",
    title: "System Lab",
    category: "system-demo",
    problem:
      "Business owners are sold tools, then left to work out how the tools relate to each other.",
    response:
      "A room of connected modules you can select to see exactly what hands off to what, and what a person still decides.",
    disciplines: ["Systems design", "Interaction", "Documentation"],
    href: "/system-lab",
  },
  {
    slug: "operator-concept",
    title: "The Operator",
    category: "concept",
    problem:
      "A business owner spends the day operating the machinery instead of operating the business.",
    response:
      "The visual study behind this site: one continuous space in which disconnected systems resolve into one architecture, and the operator stops driving it by hand.",
    disciplines: ["Art direction", "Real-time 3D", "Motion"],
  },
  {
    slug: "discoverability-concept",
    title: "Entity & Answer Surface",
    category: "concept",
    problem:
      "A business is described inaccurately by the systems people now ask first.",
    response:
      "A study in structuring a business as a consistent entity — pages, structured data and answer-first content that read the same to a person, a crawler and a language model.",
    disciplines: ["Information architecture", "Structured data", "Content structure"],
  },
] as const;

export function workByCategory(category: WorkCategory): readonly WorkItem[] {
  return workItems.filter((item) => item.category === category);
}
