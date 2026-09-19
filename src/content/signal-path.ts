/**
 * THE SIGNAL PATH — the spine of the site.
 *
 * One inquiry travels through a system that assembles around it as the
 * visitor scrolls. Each gate is a stage that actually exists in the work
 * VelaBuilt does; none of it is invented, and none of it is decoration.
 *
 * This module is the single source of truth for that path. The WebGL scene
 * builds geometry from it, the no-WebGL fallback draws an SVG from it, and
 * the page's copy is anchored to it — so every tier shows the same system in
 * the same order, and a change here changes all three.
 *
 * Deliberately free of React and of three.js: the fallback must be able to
 * import it without pulling a renderer into the bundle.
 */

/** A stage the inquiry passes through. */
export interface Gate {
  readonly id: string;
  /** Wide-tracked label rendered beside the gate. */
  readonly label: string;
  /** One line, in the buyer's terms, about what this stage does. */
  readonly note: string;
  /**
   * Position in world space. The path runs away from camera (-z) and drifts
   * laterally so gates are seen at an angle rather than face-on — a row of
   * rectangles seen head-on is a wireframe, not a space.
   */
  readonly at: readonly [number, number, number];
  /** Radians. Each gate is turned slightly so the light catches one edge. */
  readonly turn: number;
}

export const GATES: readonly Gate[] = [
  {
    id: "arrives",
    label: "Arrives",
    note: "Someone asks. On a phone, at 22:40, from a page you were asleep for.",
    at: [0, 0, 0],
    turn: 0.18,
  },
  {
    id: "captured",
    label: "Captured",
    note: "It becomes a record before it becomes a memory.",
    at: [-1.1, 0.15, -9],
    turn: -0.22,
  },
  {
    id: "qualified",
    label: "Qualified",
    note: "Sorted on what it is, not on who happened to read it.",
    at: [1.0, -0.1, -18],
    turn: 0.26,
  },
  {
    id: "followed-up",
    label: "Followed up",
    note: "On a schedule that does not depend on anyone remembering.",
    at: [-0.9, 0.2, -27],
    turn: -0.19,
  },
  {
    id: "booked",
    label: "Booked",
    note: "The right conversation reaches a calendar.",
    at: [0.8, 0.05, -36],
    turn: 0.21,
  },
  {
    id: "decided",
    label: "A person decides",
    note: "The part that should never have been automated.",
    at: [0, -0.05, -45],
    turn: 0,
  },
] as const;

/** Total path depth, used to normalise scroll progress to world position. */
export const PATH_END_Z = GATES[GATES.length - 1]!.at[2];

/**
 * Catmull-Rom through the gates, evaluated without three.js so the fallback
 * can use it too. `t` is 0..1 across the whole path.
 *
 * Uniform (centripetal-ish) parameterisation is unnecessary here: the gates
 * are near-evenly spaced in z by construction, so a plain segment walk gives
 * a smooth curve and costs nothing.
 */
export function pointAt(t: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  const span = GATES.length - 1;
  const scaled = clamped * span;
  const i = Math.min(span - 1, Math.floor(scaled));
  const f = scaled - i;

  const p0 = GATES[Math.max(0, i - 1)]!.at;
  const p1 = GATES[i]!.at;
  const p2 = GATES[i + 1]!.at;
  const p3 = GATES[Math.min(span, i + 2)]!.at;

  const axis = (a: number, b: number, c: number, d: number) => {
    const f2 = f * f;
    const f3 = f2 * f;
    return 0.5 * (
      2 * b +
      (-a + c) * f +
      (2 * a - 5 * b + 4 * c - d) * f2 +
      (-a + 3 * b - 3 * c + d) * f3
    );
  };

  return [
    axis(p0[0], p1[0], p2[0], p3[0]),
    axis(p0[1], p1[1], p2[1], p3[1]),
    axis(p0[2], p1[2], p2[2], p3[2]),
  ];
}

/**
 * How far along the path a given gate sits, 0..1. The scene uses this to
 * decide when a gate locks; the page uses it to align copy with the gate the
 * camera is passing.
 */
export function gateProgress(index: number): number {
  return index / (GATES.length - 1);
}

/**
 * The path as an SVG path string in a 0..100 x 0..100 viewBox, seen from the
 * side. This is what a visitor with no WebGL, a low-power device or a
 * reduced-motion preference gets: the same system, the same order, drawn
 * flat. It is a design, not a blank space where a canvas failed.
 */
export function svgPath(samples = 64): string {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const [x, y, z] = pointAt(i / samples);
    // z runs 0..-45 down the viewBox; x spreads ±1.1 across it.
    const sx = 50 + x * 18;
    const sy = (z / PATH_END_Z) * 92 + 4 - y * 6;
    pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(2)},${sy.toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Gate centres in the same 0..100 viewBox, for the fallback's nodes. */
export function svgGatePoints(): readonly { x: number; y: number; gate: Gate }[] {
  return GATES.map((gate) => {
    const [x, y, z] = gate.at;
    return {
      x: 50 + x * 18,
      y: (z / PATH_END_Z) * 92 + 4 - y * 6,
      gate,
    };
  });
}
