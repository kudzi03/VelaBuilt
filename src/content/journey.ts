/**
 * THE JOURNEY — the homepage opening, told as one customer's path.
 *
 * Each stage is a problem the business has, in the order a customer meets it,
 * and the VelaBuilt service that solves it. The homepage film holds on one
 * keyframe per stage (`key` indexes /public/journey/k<key>.webp and the
 * film's 5-second marks), so the order here is the order of the film.
 */

import type { ServiceSlug } from "./services";

export type JourneyStage = {
  /** `data-chapter` id; also registered in src/vela/chapters.ts. */
  readonly id: string;
  /** Short name for the instrument strip. */
  readonly label: string;
  /** Keyframe index in the film. */
  readonly key: number;
  readonly eyebrow: string;
  readonly heading: string;
  readonly body: string;
  readonly tags: readonly string[];
  /** The service page that goes deeper. */
  readonly service?: ServiceSlug;
  readonly linkLabel?: string;
};

export const journeyOpening = {
  id: "journey-opening",
  label: "VelaBuilt",
  key: 0,
  eyebrow: "VelaBuilt · Websites, ads and follow-up",
  heading: "A better website. Fewer missed opportunities.",
  body: "Follow one customer from their first search to a booked job. Every step on the way is something we build or run for you.",
} as const;

export const journeyStages: readonly JourneyStage[] = [
  {
    id: "journey-found",
    label: "Get found",
    key: 1,
    eyebrow: "01 · Get found",
    heading: "You have a website. Now people need to find it.",
    body: "Most customers start with a search. We set up and manage your Google Business Profile and run your ads, so the people already looking for what you do find you first.",
    tags: ["Google Business Profile", "Google and Meta ads", "Local search"],
    service: "website-engine-optimization",
    linkLabel: "How we help you get found",
  },
  {
    id: "journey-trust",
    label: "Earn trust",
    key: 2,
    eyebrow: "02 · Earn their trust",
    heading: "They’ve arrived. You have seconds to win them over.",
    body: "A website that says what you do, who it is for and why you can be trusted, with proof where people look for it. It loads fast and works properly on a phone.",
    tags: ["Website design", "Clear messaging", "Proof and reviews"],
    service: "website-conversion-systems",
    linkLabel: "How we build websites",
  },
  {
    id: "journey-enquiry",
    label: "Enquiries",
    key: 3,
    eyebrow: "03 · Turn attention into enquiries",
    heading: "Make it easy to say yes.",
    body: "Booking and quote forms that ask the right questions. An AI assistant answers common questions by voice or chat at any hour, and hands over to your team when a person is needed.",
    tags: ["Booking forms", "Quote requests", "AI assistant"],
    service: "ai-systems",
    linkLabel: "How AI assistants help",
  },
  {
    id: "journey-followup",
    label: "Follow up",
    key: 4,
    eyebrow: "04 · Follow up",
    heading: "Most money is lost after the first message.",
    body: "Friendly reminders in your voice go out at the right time and stop as soon as someone replies. Nobody on your team has to remember.",
    tags: ["Follow-up sequences", "Reminders", "Enquiries in one place"],
    service: "lead-follow-up-systems",
    linkLabel: "How follow-up works",
  },
  {
    id: "journey-tracked",
    label: "Keep track",
    key: 5,
    eyebrow: "05 · Keep track",
    heading: "Know where every customer stands.",
    body: "Every enquiry gets a record, a next step and someone responsible for it, in a customer system your team will actually use.",
    tags: ["CRM setup", "Clear ownership", "Key numbers in one view"],
    service: "business-systems",
    linkLabel: "How we set up business tools",
  },
  {
    id: "journey-result",
    label: "The result",
    key: 6,
    eyebrow: "The result",
    heading: "On your side: a booked job.",
    body: "More of the right people find you. More of them get in touch. Fewer of them slip away.",
    tags: [],
  },
];

/** Seconds of film between two keyframes. */
export const FILM_SECONDS_PER_STAGE = 5;
