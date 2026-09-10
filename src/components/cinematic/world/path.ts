import * as THREE from "three";
import { CHAPTERS, lerp } from "@/lib/journey";

/**
 * THE CAMERA PATH.
 *
 * One dolly down one corridor. Scroll position maps to distance travelled;
 * nothing here cuts, jumps or teleports.
 *
 * Where the camera *looks* is decided by the architecture at each station:
 * the glass wall is on the right, so the camera turns right for the website
 * chapter; the entity hangs high in the discoverability chamber, so the camera
 * lifts. Between stations those biases blend, which is what produces the slow
 * motivated turns instead of a rail pointed permanently forward.
 */

export const JOURNEY_START_Z = 12;
export const JOURNEY_END_Z = -322;

/** Metres of corridor per unit of journey progress. */
export const JOURNEY_LENGTH = JOURNEY_START_Z - JOURNEY_END_Z;

export const EYE_HEIGHT = 1.78;

/** Where the camera turns its head, per chapter. */
const LOOK_BIAS: readonly { at: number; x: number; y: number }[] = [
  { at: 0.0, x: -2.6, y: 1.35 }, // scattered systems, low and left
  { at: 0.2, x: 6.4, y: 3.1 }, // the glass wall, right
  { at: 0.4, x: -4.2, y: 2.1 }, // the inbox monolith, left
  { at: 0.6, x: 0.0, y: 2.5 }, // the lab, wide and central
  { at: 0.8, x: 0.0, y: 3.3 }, // the entity, high and central
  { at: 1.0, x: 0.0, y: 1.9 }, // the horizon, level
];

const BIAS_SIGMA = 0.115;

function blendedBias(progress: number): { x: number; y: number } {
  let weight = 0;
  let x = 0;
  let y = 0;

  for (const bias of LOOK_BIAS) {
    const distance = progress - bias.at;
    const w = Math.exp(-(distance * distance) / (2 * BIAS_SIGMA * BIAS_SIGMA));
    weight += w;
    x += bias.x * w;
    y += bias.y * w;
  }

  if (weight === 0) return { x: 0, y: 2 };
  return { x: x / weight, y: y / weight };
}

export function pathZ(progress: number): number {
  return lerp(JOURNEY_START_Z, JOURNEY_END_Z, progress);
}

/** Camera position at a point in the journey. */
export function cameraPosition(progress: number, out: THREE.Vector3): THREE.Vector3 {
  const drift = Math.sin(progress * Math.PI * 2.35) * 1.45;
  const rise = Math.sin(progress * Math.PI * 1.7) * 0.22;
  return out.set(drift, EYE_HEIGHT + rise, pathZ(progress));
}

/** Where the camera is aimed — always ahead, never behind. */
export function lookTarget(progress: number, out: THREE.Vector3): THREE.Vector3 {
  const bias = blendedBias(progress);
  const drift = Math.sin(progress * Math.PI * 2.35) * 1.45;
  return out.set(
    drift * 0.35 + bias.x,
    bias.y,
    pathZ(progress) - 17,
  );
}

/**
 * The Operator walks ahead of the camera — always in shot, never in the way.
 * He drifts to one side so he sits off-centre against the architecture rather
 * than blocking the vanishing point.
 */
export function operatorPosition(progress: number, out: THREE.Vector3): THREE.Vector3 {
  const drift = Math.sin(progress * Math.PI * 2.35) * 1.45;
  const lateral = drift * 0.5 + Math.sin(progress * Math.PI * 3.1 + 0.6) * 1.15;

  // He slows into the final chamber and stops facing the horizon.
  const lead = 9.5 - Math.max(0, progress - 0.9) * 34;

  return out.set(lateral, 0, pathZ(progress) - lead);
}

/** Chapter progress positions, for placing station geometry on the same rail. */
export const CHAPTER_PROGRESS: readonly number[] = CHAPTERS.map(
  (_, index) => index / (CHAPTERS.length - 1),
);

/** Distance from the camera to a station, in journey units. */
export function stationDistance(progress: number, index: number): number {
  return Math.abs(progress - (CHAPTER_PROGRESS[index] ?? 0));
}
