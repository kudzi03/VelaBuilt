/**
 * Where the object stands, and what it is, in each part of the site.
 *
 * A section opts in with `data-chapter="<id>"`. The driver finds the section
 * under the middle of the viewport and hands its entry here to the object.
 * Keeping the table in one place is what makes the site feel like one space:
 * a page is not a new scene, it is the same structure standing somewhere else.
 */

import { journeyOpening, journeyStages } from "@/content/journey";
import type { ShapeId } from "./geometry";
import type { ChapterSignal, Placement } from "./store";

const P = (x: number, y: number, scale: number, presence = 1): Placement => ({ x, y, scale, presence });

const entry = (
  id: string,
  shape: ShapeId,
  placement: Placement,
  mobilePlacement?: Placement,
): ChapterSignal => ({ id, shape, placement, mobilePlacement });

/** Desktop: object right of the copy. Phone: object above it. */
const SIDE = P(0.21, 0.01, 0.92);
const SIDE_M = P(0, 0.235, 0.62);
const PAGE = P(0.25, 0.06, 0.8, 0.95);
const PAGE_M = P(0.2, 0.3, 0.44, 0.9);

export const CHAPTERS: Record<string, ChapterSignal> = {
  opening: entry("opening", "armature", P(0.23, 0.2, 0.55), P(0, 0.245, 0.58)),
  digital: entry("digital", "planes", SIDE, SIDE_M),
  ai: entry("ai", "aperture", SIDE, SIDE_M),
  automation: entry("automation", "circuit", P(0.2, 0.01, 0.84), P(0, 0.235, 0.52)),
  systems: entry("systems", "lattice", SIDE, SIDE_M),
  work: entry("work", "frame", P(0.24, 0, 0.8, 0.9), P(0, 0.26, 0.5, 0.9)),
  answers: entry("answers", "armature", P(0.3, 0, 0.6, 0)),
  contact: entry("contact", "armature", P(0, 0.29, 0.5), P(0, 0.28, 0.55)),

  "page-digital": entry("page-digital", "planes", PAGE, PAGE_M),
  "page-ai": entry("page-ai", "aperture", PAGE, PAGE_M),
  "page-automation": entry("page-automation", "circuit", P(0.24, 0.06, 0.7, 0.95), P(0.18, 0.3, 0.36, 0.9)),
  "page-systems": entry("page-systems", "lattice", PAGE, PAGE_M),
  "page-discover": entry("page-discover", "armature", PAGE, PAGE_M),
  "page-work": entry("page-work", "frame", PAGE, PAGE_M),
  "page-project": entry("page-project", "frame", P(0.26, 0.08, 0.66, 0.9), P(0.2, 0.3, 0.4, 0.85)),
  "page-studio": entry("page-studio", "armature", PAGE, PAGE_M),
  "page-contact": entry("page-contact", "armature", PAGE, PAGE_M),
  "page-lab": entry("page-lab", "circuit", P(0.24, 0.06, 0.7, 0.95), P(0.18, 0.3, 0.36, 0.9)),
  "page-quiet": entry("page-quiet", "armature", P(0.3, 0.05, 0.6, 0.35), P(0.25, 0.32, 0.36, 0.3)),
  /** Solid reading ground: the object steps out entirely. */
  reading: entry("reading", "armature", P(0.3, 0, 0.6, 0), P(0.3, 0, 0.4, 0)),

  /** The homepage film (src/content/journey.ts): the object steps out while it plays. */
  ...Object.fromEntries(
    [journeyOpening, ...journeyStages].map(({ id }) => [id, entry(id, "armature", P(0.3, 0, 0.6, 0), P(0.3, 0, 0.4, 0))]),
  ),
};

export type ChapterId = keyof typeof CHAPTERS;

export function chapter(id: string | undefined | null): ChapterSignal | null {
  return (id && CHAPTERS[id]) || null;
}

/** The homepage, in order, as the instrument strip counts it. */
export const HOME_SEQUENCE: readonly { readonly id: string; readonly label: string }[] = [
  { id: journeyOpening.id, label: journeyOpening.label },
  ...journeyStages.map(({ id, label }) => ({ id, label })),
  { id: "work", label: "Work" },
  { id: "answers", label: "Answers" },
  { id: "contact", label: "Contact" },
];

/** Journey chapter ids, for anything that marks "what we do" as current. */
export const JOURNEY_CHAPTERS: readonly string[] = journeyStages.map(({ id }) => id);
