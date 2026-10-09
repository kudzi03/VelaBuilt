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
      "VelaBuilt builds websites that help people understand and contact your business. We also build tools that answer common questions, help you follow up and keep customer work organised.",
    scope: "home",
  },
  {
    question: "Does VelaBuilt build websites?",
    answer:
      "Yes. We build websites that show what you do, look right for your business, work well on a phone and make it easy for visitors to get in touch. Interactive features are included when they help the visitor.",
    scope: "home",
  },
  {
    question: "Can VelaBuilt add an AI assistant?",
    answer:
      "Yes. We build voice and chat assistants that answer using information you approve. They hand questions to your team when they do not know or a person needs to decide.",
    scope: "home",
  },
  {
    question: "Can VelaBuilt help us follow up and reduce admin?",
    answer:
      "Yes. We can bring enquiries into one place, send timely follow-ups, set reminders, help with bookings and reduce repeated data entry.",
    scope: "home",
  },
  {
    question: "Can VelaBuilt help us keep customer details in one place?",
    answer:
      "Yes. We can improve the customer system you already use or build one that fits your work. We will recommend the simpler option when it does the job.",
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
      "Yes, when the existing site is sound. Clearer words, a better path to contact and faster pages may be enough, and we will say so instead of recommending a rebuild.",
    scope: "website-conversion-systems",
  },
  {
    question: "How long does a website build take?",
    answer:
      "It depends on what the site needs. We agree on a timeline in writing before work starts, including time to get the message and content right.",
    scope: "website-conversion-systems",
  },
  {
    question: "Will the AI assistant make things up?",
    answer:
      "It is built to answer from information you approve and to say when it does not know. It must not invent prices, promises or results.",
    scope: "ai-systems",
  },
  {
    question: "Can the assistant do more than answer questions?",
    answer:
      "Yes, within limits you approve. It can help with tasks such as opening a form, checking information or updating a record. Important decisions can require your team’s approval.",
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
      "The messages use your words and stop when someone replies. We keep them helpful and limited, and your team handles situations that need a personal response.",
    scope: "lead-follow-up-systems",
  },
  {
    question: "Do we have to replace our customer records tool?",
    answer:
      "Usually not. If your current customer system can do the job, we can set it up to fit your work. We only recommend replacing it when it cannot meet your needs.",
    scope: "business-systems",
  },
  {
    question: "Is this the same as SEO?",
    answer:
      "Search engine optimisation (SEO) is part of it. We also make your business information clear and consistent, so people can understand what you offer wherever they find you online.",
    scope: "website-engine-optimization",
  },
  {
    question: "Can you guarantee first-page rankings?",
    answer:
      "No. Nobody can honestly promise a top ranking. We can fix issues that stop search engines finding or understanding your pages, then show you what changed.",
    scope: "website-engine-optimization",
  },
] as const;

export function faqsFor(scope: FaqEntry["scope"]): readonly FaqEntry[] {
  return faqs.filter((entry) => entry.scope === scope);
}
