/**
 * Where the signal is, right now.
 *
 * A mutable module object rather than React state, for the same reason the
 * previous camera used one: the renderer reads this every frame, and a
 * setState per frame would re-render the page sixty times a second.
 *
 * `progress` is 0 at the top of the journey and 1 at its end. `visible` lets
 * the renderer stop drawing entirely when the run is off screen.
 */
export interface SignalState {
  /** Scrubbed scroll position along the path, 0..1. */
  progress: number;
  /** Rate of change per second, for motion-dependent effects. */
  velocity: number;
  /** Whether the journey container is on screen at all. */
  visible: boolean;
  /** Mirrors the visitor's reduced-motion preference. */
  reducedMotion: boolean;
  /**
   * Set by the renderer. On-demand rendering means a still page draws
   * nothing, so the driver has to knock when the visitor starts moving
   * again.
   */
  wake?: () => void;
}

export const signal: SignalState = {
  progress: 0,
  velocity: 0,
  visible: false,
  reducedMotion: false,
};

/** Index of the gate the camera is nearest, for copy that follows the camera. */
export function nearestGate(progress: number, gateCount: number): number {
  return Math.max(0, Math.min(gateCount - 1, Math.round(progress * (gateCount - 1))));
}

type GateListener = (index: number) => void;
const gateListeners = new Set<GateListener>();
let announcedGate = -1;

/**
 * The one place a scroll position is allowed to become React state: when the
 * camera arrives at a different gate, which happens a handful of times per
 * page rather than per frame.
 */
export function setGate(index: number): void {
  if (index === announcedGate) return;
  announcedGate = index;
  for (const listener of gateListeners) listener(index);
}

export function subscribeToGate(listener: GateListener): () => void {
  gateListeners.add(listener);
  listener(announcedGate < 0 ? 0 : announcedGate);
  return () => gateListeners.delete(listener);
}

export const clamp01 = (value: number): number =>
  value < 0 ? 0 : value > 1 ? 1 : value;
