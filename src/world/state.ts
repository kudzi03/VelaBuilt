/**
 * WHERE THE VISITOR IS, AND WHAT THEY ARE LOOKING AT.
 *
 * A single mutable object, written by the frame loop and read by the HUD, the
 * audio engine and the voice guide. Not React state: the player's position
 * changes sixty times a second and none of those changes should render a
 * component. Anything that genuinely needs to re-render subscribes to the
 * *coarse* signals below — hall changed, focus changed — which fire a handful
 * of times per visit rather than per frame.
 *
 * This is also the surface the voice guide is given. It is deliberately a
 * narrow, described vocabulary — hall id, focus id, a few booleans — and not
 * a handle on the scene. The guide can be told "you are in Cadence"; it can
 * never be handed the renderer.
 */

import type { HallId } from "./facility";

export interface WorldContext {
  /** Which hall the visitor is standing in, or null in a corridor. */
  hall: HallId | null;
  /** The interactive thing under the crosshair, if any. */
  focus: string | null;
  /** True once the entry sequence has handed over control. */
  entered: boolean;
  /** 0..1 — how fast they are moving. Drives footsteps and the guide's tact. */
  speed: number;
  /** Metres walked this visit. */
  distance: number;
  /** Set when the visitor has asked for silence. */
  muted: boolean;
  /** Set when the voice guide is enabled. */
  voice: boolean;
}

export const worldContext: WorldContext = {
  hall: null,
  focus: null,
  entered: false,
  speed: 0,
  distance: 0,
  muted: false,
  voice: false,
};

/* ── coarse subscriptions ───────────────────────────────────────────────── */

type Listener = () => void;

const listeners: Record<CoarseKey, Set<Listener>> = {
  hall: new Set(),
  focus: new Set(),
  entered: new Set(),
  audio: new Set(),
};

export type CoarseKey = "hall" | "focus" | "entered" | "audio";

export function subscribe(key: CoarseKey, fn: Listener): () => void {
  listeners[key].add(fn);
  return () => listeners[key].delete(fn);
}

function emit(key: CoarseKey): void {
  for (const fn of listeners[key]) fn();
}

/**
 * Write a coarse field and notify only if it actually changed. The frame loop
 * calls setHall() every frame; it must be free when nothing has moved.
 */
export function setHall(hall: HallId | null): void {
  if (worldContext.hall === hall) return;
  worldContext.hall = hall;
  emit("hall");
}

export function setFocus(focus: string | null): void {
  if (worldContext.focus === focus) return;
  worldContext.focus = focus;
  emit("focus");
}

export function setEntered(v: boolean): void {
  if (worldContext.entered === v) return;
  worldContext.entered = v;
  emit("entered");
}

export function setAudio(next: { muted?: boolean; voice?: boolean }): void {
  let changed = false;
  if (next.muted !== undefined && next.muted !== worldContext.muted) {
    worldContext.muted = next.muted;
    changed = true;
  }
  if (next.voice !== undefined && next.voice !== worldContext.voice) {
    worldContext.voice = next.voice;
    changed = true;
  }
  if (changed) emit("audio");
}

/** Reset on unmount so a remount does not inherit a stale position. */
export function resetWorldContext(): void {
  worldContext.hall = null;
  worldContext.focus = null;
  worldContext.entered = false;
  worldContext.speed = 0;
  worldContext.distance = 0;
  emit("hall");
  emit("focus");
  emit("entered");
}
