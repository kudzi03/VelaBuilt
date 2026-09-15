/**
 * PROGRESSIVE ENHANCEMENT TIERS.
 *
 *   A — capable desktop: full corridor, full choreography.
 *   B — modern mobile / tablet / modest GPU: same world, fewer metres of it,
 *       lower pixel ratio, simplified materials.
 *   C — reduced motion, failed or absent WebGL, constrained device: the CSS
 *       composited world. Identical semantic content, no canvas.
 *
 * The server always renders Tier C markup. The probe runs after mount and
 * upgrades. Because every tier renders the *same* DOM content and only swaps
 * the backdrop layer, upgrading never moves text and never costs CLS.
 */

export type Tier = "A" | "B" | "C";

export interface Capability {
  readonly tier: Tier;
  /** Upper bound on device pixel ratio for the canvas. */
  readonly dpr: readonly [number, number];
  /** Reduced-motion preference, tracked separately from tier. */
  readonly reducedMotion: boolean;
  /** Whether the 3D corridor should mount at all. */
  readonly webgl: boolean;
}

export const TIER_C: Capability = {
  tier: "C",
  dpr: [1, 1],
  reducedMotion: false,
  webgl: false,
};

/**
 * Whether the browser offers WebGL2, which the compositor is written for.
 *
 * This checks for the API instead of creating a context to test. A probe
 * context was the single most expensive thing the page did at startup: on a
 * cold GPU process it took ~270 ms, inside the render that follows hydration.
 * A device that exposes WebGL2 but cannot create a context (blocklisted
 * driver, lost GPU) is caught when the compositor starts, and the stage keeps
 * its stills — see PlateCanvas `onFailure`.
 */
function hasWebGL(): boolean {
  return typeof window !== "undefined" && typeof window.WebGL2RenderingContext === "function";
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export function probeCapability(): Capability {
  if (typeof window === "undefined") return TIER_C;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) return { ...TIER_C, reducedMotion: true };
  if (!hasWebGL()) return TIER_C;

  const nav = navigator as NavigatorWithHints;

  // Explicit data-saving or a very slow connection: do not spend a canvas.
  if (nav.connection?.saveData) return TIER_C;
  if (
    nav.connection?.effectiveType === "slow-2g" ||
    nav.connection?.effectiveType === "2g"
  ) {
    return TIER_C;
  }

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory <= 2 || cores <= 2) return TIER_C;

  // Tier B is for phones, tablets, small windows and genuinely modest
  // machines. A four-core laptop runs the full corridor comfortably — the
  // scene is emissive geometry, not a lit, shadowed, post-processed one — so
  // the bar for Tier A is deliberately not set at "workstation".
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 1024;
  const modest = memory < 4 || cores < 4;

  if (coarse || narrow || modest) {
    return { tier: "B", dpr: [1, 1.5], reducedMotion: false, webgl: true };
  }

  return { tier: "A", dpr: [1, 2], reducedMotion: false, webgl: true };
}

/** Metres of corridor detail rendered around the camera, per tier. */
export const DRAW_DISTANCE: Record<Tier, number> = {
  A: 96,
  B: 68,
  C: 0,
};

/* -------------------------------------------------------------------------- */
/* Reading the tier from React                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The probe result is external state: it comes from the device, not from
 * React, and it changes only when the visitor changes a system preference.
 * Exposing it through a store rather than an effect means the server snapshot
 * (always Tier C) and the client snapshot are both explicit, and no render
 * happens beyond the one the change actually requires.
 */
let snapshot: Capability | null = null;

function getSnapshot(): Capability {
  // Cached so repeated reads are referentially stable, as the store requires.
  snapshot ??= probeCapability();
  return snapshot;
}

function getServerSnapshot(): Capability {
  return TIER_C;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const queries = [
    window.matchMedia("(prefers-reduced-motion: reduce)"),
    window.matchMedia("(pointer: coarse)"),
  ];

  const handle = () => {
    snapshot = probeCapability();
    onChange();
  };

  for (const query of queries) query.addEventListener("change", handle);
  return () => {
    for (const query of queries) query.removeEventListener("change", handle);
  };
}

export const capabilityStore = { subscribe, getSnapshot, getServerSnapshot };
