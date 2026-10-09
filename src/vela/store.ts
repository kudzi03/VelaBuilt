/**
 * THE BRIDGE between the page and the object.
 *
 * The render loop reads plain fields from `vela` every frame. React reads the
 * few things it displays (visual presence, active chapter) through
 * `useVelaSnapshot`, which only re-renders when one of those actually changes.
 * Nothing here causes a React render per frame, and nothing in the render
 * loop waits on React.
 *
 * No three.js and no SDK imports: this module is on the critical path of
 * every page and must stay a few hundred bytes.
 */

import { useSyncExternalStore } from "react";
import type { ShapeId } from "./geometry";

/**
 * What Vela is doing. The object's behaviour is keyed off this, so the list
 * is the design: each state has a distinct physical response.
 */
export type Presence = "dormant";

/** How the object is placed in the frame for a given chapter. */
export interface Placement {
  /** Horizontal position in viewport widths from centre (−0.5 … 0.5). */
  readonly x: number;
  /** Vertical position in viewport heights from centre. */
  readonly y: number;
  /** Relative size. 1 = hero. */
  readonly scale: number;
  /** 0–1 how present it is. Reading chapters push it back. */
  readonly presence: number;
}

export interface ChapterSignal {
  readonly id: string;
  readonly shape: ShapeId;
  readonly placement: Placement;
  readonly mobilePlacement?: Placement;
}

interface Snapshot {
  readonly presence: Presence;
  readonly chapter: string;
}

/** Mutable, per-frame. Written by page drivers; read by the loop. */
export const vela = {
  presence: "dormant" as Presence,
  shape: "armature" as ShapeId,
  placement: { x: 0, y: 0, scale: 1, presence: 1 } as Placement,
  /** −1 … 1, the pointer in normalised viewport space. */
  pointer: { x: 0, y: 0, active: false },
  /** Scroll velocity, px per frame, damped. Gives the structure some inertia. */
  scrollVelocity: 0,
  /** True while a solid sheet covers the whole viewport: the loop can sleep. */
  covered: false,
  /** A one-shot flare, e.g. when a tool fires. Decays in the loop. */
  flare: 0,
  /** Wakes a demand-driven loop (reduced motion). Replaced by the canvas. */
  invalidate: () => {},
};

let snapshot: Snapshot = { presence: "dormant", chapter: "opening" };
const listeners = new Set<() => void>();

function emit(next: Partial<Snapshot>) {
  const merged = { ...snapshot, ...next };
  if (
    merged.presence === snapshot.presence &&
    merged.chapter === snapshot.chapter
  )
    return;
  snapshot = merged;
  for (const l of listeners) l();
}

export function setPresence(presence: Presence) {
  vela.presence = presence;
  emit({ presence });
  vela.invalidate();
}

export function setChapter(signal: ChapterSignal, mobile: boolean) {
  vela.shape = signal.shape;
  vela.placement = (mobile && signal.mobilePlacement) || signal.placement;
  emit({ chapter: signal.id });
  vela.invalidate();
}

export function flare(amount = 1) {
  vela.flare = Math.max(vela.flare, amount);
  vela.invalidate();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const get = () => snapshot;

export function useVelaSnapshot(): Snapshot {
  return useSyncExternalStore(subscribe, get, get);
}
