/**
 * FAQ — answer-first, and only questions a buyer genuinely asks.
 *
 * Every entry here is rendered visibly on a page before it is eligible for
 * FAQPage structured data. `scope` decides which page carries it.
 */

import type { ServiceSlug } from "./services";

export interface FaqEntry {
  readonly question: string;
  /** Answer-first: the first sentence must stand alone as the answer. */
  readonly answer: string;
  readonly scope: "home" | ServiceSlug;
}

export const faqs: readonly FaqEntry[] = [
  {
    question: "What does VelaBuilt do?",
    answer:
      "VelaBuilt designs and builds websites, AI agents, business automation and operational systems such as CRMs and dashboards. The work is usually connected: the website brings the enquiry in, and the systems behind it make sure it is answered, followed up and recorded.",
    scope: "home",
  },
  {
    question: "Does VelaBuilt build websites?",
    answer:
      "Yes — premium websites and interactive experiences, including real-time 3D where it earns its place. Each build covers positioning, design, engineering, performance, accessibility and the path from first visit to enquiry.",
    scope: "home",
  },
  {
    question: "Does VelaBuilt build AI agents?",
    answer:
      "Yes. Voice and chat agents grounded in a business’s own information, with a defined set of actions and a person kept in charge of decisions that matter. Vela, the voice guide on this site, is one.",
    scope: "home",
  },
  {
    question: "Can VelaBuilt automate business workflows?",
    answer:
      "Yes. The most common are enquiry capture, qualification, follow-up sequences, reminders, booking and CRM updates — plus the repeated admin that sits between tools.",
    scope: "home",
  },
  {
    question: "Does VelaBuilt build CRM systems?",
    answer:
      "Yes — configured on an existing platform or built to fit, with the enquiry handling, dashboards and workflows around it. Which is right depends on the business, and we say which.",
    scope: "home",
  },
  {
    question: "How much does a project cost?",
    answer:
      "It depends on what needs building, so every project is scoped before it is priced. There are no fixed packages; the first step is a short conversation about what is actually happening in the business.",
    scope: "home",
  },
  {
    question: "How do I work with VelaBuilt?",
    answer:
      "Start an enquiry on this site or email jace@velabuilt.com. A person reads every enquiry and replies with an honest assessment — including when we are not the right people for it. If it is a fit, the work is scoped in writing before anything is built.",
    scope: "home",
  },
  {
    question: "Can you improve my existing website instead of rebuilding it?",
    answer:
      "Sometimes, and we will tell you when that is the honest answer. If the structure and platform are sound, targeted work on message, conversion path and performance is faster and cheaper than a rebuild.",
    scope: "website-conversion-systems",
  },
  {
    question: "How long does a website build take?",
    answer:
      "It depends on scope, and the timeline is agreed in writing before work starts. The variable is rarely design or development — it is how long it takes to agree what the business is actually saying.",
    scope: "website-conversion-systems",
  },
  {
    question: "Will an AI agent make things up?",
    answer:
      "It should not, and it is built not to. The agent answers from an explicit knowledge base, is told what it must not invent — prices, commitments, results — and says it does not know rather than guessing.",
    scope: "ai-systems",
  },
  {
    question: "Can an agent take actions, not just answer?",
    answer:
      "Yes, through tools defined in advance — opening a form, booking, looking something up, updating a record. It can only do what it has been given a tool for, and anything that commits the business can require a person’s approval.",
    scope: "ai-systems",
  },
  {
    question: "Will this work with the tools we already use?",
    answer:
      "Usually, yes. We would rather connect what already works than migrate a business for the sake of it, and we will say plainly when an existing tool is the reason the process keeps breaking.",
    scope: "lead-follow-up-systems",
  },
  {
    question: "Will automated follow-up sound like a robot chasing my customers?",
    answer:
      "Not if it is built properly. Messages use your language and stop the moment a person replies, the sequence is short rather than relentless, and anything that needs judgment is escalated to you.",
    scope: "lead-follow-up-systems",
  },
  {
    question: "Do we have to replace our current CRM?",
    answer:
      "Often not. If the platform is sound and only badly configured, fixing the configuration is the recommendation. A rebuild is only worth it when the platform itself is the constraint.",
    scope: "business-systems",
  },
  {
    question: "Is this just SEO with a different name?",
    answer:
      "It includes technical SEO, but the goal is broader: making a business straightforward to find and accurate to describe, whether the visitor arrives through a search engine, a map or an AI assistant.",
    scope: "website-engine-optimization",
  },
  {
    question: "Can you guarantee first-page rankings?",
    answer:
      "No, and neither can anyone else honestly. We can make sure the foundations are correct, the site is fast and crawlable, and that you can see what changed.",
    scope: "website-engine-optimization",
  },
] as const;

export function faqsFor(scope: FaqEntry["scope"]): readonly FaqEntry[] {
  return faqs.filter((entry) => entry.scope === scope);
}
