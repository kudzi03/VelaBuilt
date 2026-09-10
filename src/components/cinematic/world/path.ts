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

/**
 * How far back from a station's centre the camera comes to rest. The station
 * is a place in the room, not a mark to stand on: arriving 14 metres short
 * frames it rather than landing inside it, and it stops the camera overshooting
 * the destination at the end of the journey.
 */
const CAMERA_STANDOFF = 14;

const LAST = CHAPTERS.length - 1;

export const JOURNEY_START_Z = CHAPTERS[0]!.z + CAMERA_STANDOFF;
export const JOURNEY_END_Z = CHAPTERS[LAST]!.z + CAMERA_STANDOFF;

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

/**
 * Depth along the corridor. Interpolates the chapters' own z positions rather
 * than a straight line between two endpoints, so progress 0.4 puts the camera
 * at station 2 exactly — however the chapters are spaced.
 */
export function pathZ(progress: number): number {
  const station = Math.min(1, Math.max(0, progress)) * LAST;
  const index = Math.min(LAST - 1, Math.floor(station));
  const t = station - index;
  const from = CHAPTERS[index]!.z;
  const to = CHAPTERS[index + 1]!.z;
  return lerp(from, to, t) + CAMERA_STANDOFF;
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

  // Into the final chamber he draws away from the camera rather than toward
  // it: the machinery no longer needs him, so he walks on into the light.
  const lead = 9.5 + Math.max(0, progress - 0.84) * 78;

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
