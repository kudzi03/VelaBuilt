/**
 * START A PROJECT — the progressive enquiry.
 *
 * Deliberately short: one focus question, at most two branch questions, then
 * the minimum needed to continue the conversation. The flow is data so the
 * client renderer, the server validator and the confirmation summary all
 * agree on what a valid enquiry looks like.
 */

export const FOCUS_OPTIONS = [
  "website",
  "follow-up",
  "automation",
  "ai",
  "systems",
  "discoverability",
  "not-sure",
] as const;

export type Focus = (typeof FOCUS_OPTIONS)[number];

export interface FlowOption {
  readonly value: string;
  readonly label: string;
  readonly hint?: string;
}

export interface FlowStep {
  readonly id: string;
  readonly question: string;
  readonly help?: string;
  readonly multi?: boolean;
  readonly options: readonly FlowOption[];
}

export const focusStep: FlowStep = {
  id: "focus",
  question: "What are you trying to improve?",
  help: "Pick the closest. We will work out the detail together.",
  options: [
    {
      value: "website",
      label: "Website",
      hint: "It undersells the business, or nobody inquires.",
    },
    {
      value: "follow-up",
      label: "Follow-up / sales process",
      hint: "Inquiries arrive and then go quiet.",
    },
    {
      value: "automation",
      label: "Automation",
      hint: "People repeat work software could do.",
    },
    {
      value: "ai",
      label: "AI system",
      hint: "Reading, drafting, classifying, answering.",
    },
    {
      value: "systems",
      label: "Business system",
      hint: "CRM, enquiry handling, dashboards.",
    },
    {
      value: "discoverability",
      label: "Discoverability",
      hint: "Hard to find, or described inaccurately.",
    },
    {
      value: "not-sure",
      label: "Not sure yet",
      hint: "Something is not working. That is enough to start.",
    },
  ],
};

/** Second question, chosen by focus. */
export const branchSteps: Record<Focus, FlowStep> = {
  website: {
    id: "website-problem",
    question: "What is the website getting wrong?",
    multi: true,
    options: [
      { value: "looks-dated", label: "It looks smaller than the business is" },
      { value: "unclear", label: "Visitors cannot tell what we do" },
      { value: "no-enquiries", label: "Traffic arrives, inquiries do not" },
      { value: "mobile", label: "It is poor on a phone" },
      { value: "slow", label: "It is slow or unreliable" },
      { value: "outgrown", label: "We have outgrown it" },
    ],
  },
  "follow-up": {
    id: "follow-up-problem",
    question: "Where does it break down?",
    multi: true,
    options: [
      { value: "capture", label: "Inquiries arrive in too many places" },
      { value: "speed", label: "We reply too slowly" },
      { value: "chasing", label: "Quotes go out and are never chased" },
      { value: "visibility", label: "Nobody can see what is open" },
      { value: "booking", label: "Booking a call takes too many messages" },
      { value: "records", label: "The details live in someone’s head" },
    ],
  },
  automation: {
    id: "automation-problem",
    question: "What work gets repeated most?",
    multi: true,
    options: [
      { value: "data-entry", label: "Re-typing the same information" },
      { value: "quotes", label: "Producing quotes and estimates" },
      { value: "scheduling", label: "Scheduling and reminders" },
      { value: "reporting", label: "Assembling reports" },
      { value: "handoffs", label: "Passing work between people or tools" },
      { value: "admin", label: "General admin nobody has time for" },
    ],
  },
  ai: {
    id: "ai-problem",
    question: "Where would judgment-free reading or drafting help?",
    multi: true,
    options: [
      { value: "enquiries", label: "Reading and sorting incoming inquiries" },
      { value: "drafting", label: "Drafting replies and documents" },
      { value: "reception", label: "Answering common questions first" },
      { value: "summarising", label: "Summarizing calls, notes or documents" },
      { value: "classifying", label: "Classifying and routing work" },
      { value: "unsure", label: "Not sure — that is part of the question" },
    ],
  },
  systems: {
    id: "systems-problem",
    question: "What would the system need to hold together?",
    multi: true,
    options: [
      { value: "crm", label: "Customers and opportunities (CRM)" },
      { value: "enquiries", label: "Enquiries and who owns them" },
      { value: "dashboards", label: "The numbers we run the business on" },
      { value: "jobs", label: "Jobs, projects or bookings" },
      { value: "integrations", label: "Tools that do not talk to each other" },
      { value: "unsure", label: "Not sure — that is part of the question" },
    ],
  },
  discoverability: {
    id: "discoverability-problem",
    question: "How are customers failing to find you?",
    multi: true,
    options: [
      { value: "search", label: "We do not appear in search" },
      { value: "local", label: "We are invisible locally" },
      { value: "indexing", label: "Our pages are not indexed properly" },
      { value: "ai-answers", label: "AI assistants describe us wrongly" },
      { value: "content", label: "We do not answer what people ask" },
      { value: "measurement", label: "We cannot tell what is working" },
    ],
  },
  "not-sure": {
    id: "not-sure-context",
    question: "What made you look today?",
    options: [
      { value: "losing-work", label: "We are losing work we should be winning" },
      { value: "growth", label: "We are growing and the systems are straining" },
      { value: "manual", label: "Too much is manual" },
      { value: "appearance", label: "We look behind our competitors" },
      { value: "advice", label: "We want an honest assessment" },
    ],
  },
};

/** Third question, common to every branch. */
export const timelineStep: FlowStep = {
  id: "timeline",
  question: "When would you want this underway?",
  options: [
    { value: "now", label: "Now" },
    { value: "quarter", label: "Within a few months" },
    { value: "planning", label: "Planning ahead" },
    { value: "exploring", label: "Exploring options" },
  ],
};

/**
 * The /start intro line for a visitor who arrived from a specific promise.
 * Three calls to action offer something particular — "Show me what you’d
 * change", "Map my follow-up", "Check my discoverability" — and each
 * pre-answers the first question, so the page restates that offer instead of
 * the general one. Any other focus keeps the general intro.
 */
export const focusIntro: Partial<Record<Focus, string>> = {
  website:
    "Three short questions about your website. A person reads every one, and replies with what we would change, including when we are not the right people for it.",
  "follow-up":
    "Three short questions about how inquiries are followed up. A person reads every one, and replies with where it breaks down, including when we are not the right people for it.",
  discoverability:
    "Three short questions about how customers find you. A person reads every one, and replies with what is stopping them, including when we are not the right people for it.",
};

export const focusLabel: Record<Focus, string> = {
  website: "Website",
  "follow-up": "Follow-up / sales process",
  automation: "Automation",
  ai: "AI system",
  systems: "Business system",
  discoverability: "Discoverability",
  "not-sure": "Not sure yet",
};

/** Ordered step ids for a given focus — used by client and server alike. */
export function stepsForFocus(focus: Focus): readonly FlowStep[] {
  return [focusStep, branchSteps[focus], timelineStep];
}

export function labelForAnswer(stepId: string, value: string): string {
  const step =
    stepId === focusStep.id
      ? focusStep
      : stepId === timelineStep.id
        ? timelineStep
        : Object.values(branchSteps).find((candidate) => candidate.id === stepId);
  return step?.options.find((option) => option.value === value)?.label ?? value;
}
