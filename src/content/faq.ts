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
    question: "What does VelaBuilt actually build?",
    answer:
      "Three things: websites, follow-up systems and the technical foundations that make a business discoverable. In practice that means a premium website that makes a business easier to trust and contact, infrastructure that catches and follows up every enquiry, and the structure that lets people, search engines and AI systems understand what the business does.",
    scope: "home",
  },
  {
    question: "Who is VelaBuilt for?",
    answer:
      "Established businesses whose digital presence has fallen behind the quality of their work. Typically the business is winning work through reputation, and losing opportunities to a website that undersells it or a follow-up process that depends on somebody remembering.",
    scope: "home",
  },
  {
    question: "Do you only do websites, or the systems behind them?",
    answer:
      "Both, and they are usually the same problem. A website that generates enquiries a business cannot follow up is not finished work, so we build the capture, the records and the follow-up as part of the same architecture where it is needed.",
    scope: "home",
  },
  {
    question: "What happens when I start a project?",
    answer:
      "You answer a short set of questions about what you are trying to improve, and we reply with an assessment. There is no pitch deck stage: the first conversation is about what is actually happening in the business now, and whether we are the right people to fix it.",
    scope: "home",
  },
  {
    question: "Why is there no list of client results on the site?",
    answer:
      "Because we only publish work we can evidence and the client has agreed to. Anything shown as a concept is a study, and anything shown as a system demo runs on sample data. We would rather launch honest than launch with invented case studies.",
    scope: "home",
  },
  {
    question: "Do you use AI in the systems you build?",
    answer:
      "Where it removes work a person would otherwise repeat — reading and classifying enquiries, drafting replies, structuring information. It proposes; a person decides anything that commits the business, and low-confidence cases escalate to a human by design.",
    scope: "home",
  },
  {
    question: "Can you improve my existing website instead of rebuilding it?",
    answer:
      "Sometimes, and we will tell you when that is the honest answer. If the structure and platform are sound, targeted work on message, conversion path and performance is faster and cheaper than a rebuild. If the foundations are the problem, patching them costs more over time.",
    scope: "website-conversion-systems",
  },
  {
    question: "How long does a website build take?",
    answer:
      "Most builds run between four and ten weeks depending on scope and how quickly content decisions are made. The variable is rarely design or development — it is how long it takes to agree what the business is actually saying.",
    scope: "website-conversion-systems",
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
      "Not if it is built properly. Messages use your language and stop the moment a person replies, the sequence is short rather than relentless, and anything that needs judgement is escalated to you instead of being answered automatically.",
    scope: "lead-follow-up-systems",
  },
  {
    question: "Is this just SEO with a different name?",
    answer:
      "It includes technical SEO, but the goal is broader: making a business straightforward to find and accurate to describe, whether the visitor arrives through a search engine, a map, a link or an AI assistant. The work is engineering and information structure, not link buying.",
    scope: "website-engine-optimization",
  },
  {
    question: "Can you guarantee first-page rankings?",
    answer:
      "No, and neither can anyone else honestly. We can guarantee the foundations are correct, the site is fast and crawlable, the business is structured so it can be understood, and that you will be able to see what changed.",
    scope: "website-engine-optimization",
  },
] as const;

export function faqsFor(scope: FaqEntry["scope"]): readonly FaqEntry[] {
  return faqs.filter((entry) => entry.scope === scope);
}
