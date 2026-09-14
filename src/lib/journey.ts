/**
 * THE JOURNEY — one camera, one space, six chapters.
 *
 * A single scroll position drives both the semantic DOM chapters and the 3D
 * camera travelling the corridor. The value lives outside React on purpose:
 * the render loop reads it every frame without triggering a re-render, and
 * React components subscribe only to *chapter changes*, which are rare.
 *
 * Chapter `z` values are metres along the corridor in the 3D world. The DOM
 * and the world therefore share one coordinate system — a section and its
 * station are the same place.
 */

export type ChapterId =
  | "friction"
  | "website"
  | "enquiry"
  | "lab"
  | "discoverability"
  | "destination";

export interface Chapter {
  readonly id: ChapterId;
  readonly index: number;
  /** Scene number as shown in the interface. */
  readonly scene: string;
  readonly label: string;
  /** Station depth in the world, metres along -Z. */
  readonly z: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "friction", index: 0, scene: "01", label: "Friction", z: 0 },
  { id: "website", index: 1, scene: "02", label: "The Website", z: -62 },
  { id: "enquiry", index: 2, scene: "03", label: "The Lost Inquiry", z: -124 },
  { id: "lab", index: 3, scene: "04", label: "System Lab", z: -186 },
  { id: "discoverability", index: 4, scene: "05", label: "Discoverability", z: -248 },
  { id: "destination", index: 5, scene: "06", label: "Destination", z: -310 },
] as const;

export const LAST_CHAPTER = CHAPTERS.length - 1;

/**
 * Live journey state. Mutated in place by the driver; read in `useFrame`.
 */
export const journey = {
  /** Raw 0→1 across the cinematic run. */
  progress: 0,
  /** Critically-damped follow of `progress`. This is what the camera uses. */
  smooth: 0,
  /** Units per second of `smooth`. Drives the operator's walk cycle. */
  velocity: 0,
  /** Continuous chapter position, e.g. 2.4 = 40% from chapter 2 to 3. */
  station: 0,
  /** Nearest chapter index. */
  chapter: 0,
  /** True while the cinematic run is on screen and worth rendering. */
  visible: false,
  /** Set once by the capability probe. */
  reducedMotion: false,
};

type ChapterListener = (chapter: number) => void;
const chapterListeners = new Set<ChapterListener>();

export function subscribeToChapter(listener: ChapterListener): () => void {
  chapterListeners.add(listener);
  return () => {
    chapterListeners.delete(listener);
  };
}

export function setChapter(next: number): void {
  if (next === journey.chapter) return;
  journey.chapter = next;
  for (const listener of chapterListeners) listener(next);
}

export const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent damping. `smoothing` is the fraction left after 1s. */
export function damp(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
): number {
  return lerp(current, target, 1 - Math.pow(smoothing, delta));
}

/** 0→1 ramp over [start, end] of the journey, eased. */
export function window01(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

export const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
