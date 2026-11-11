import { buildArmature } from "./geometry";

/**
 * The VelaBuilt armature, projected once to SVG. The object no longer stands
 * on the site; this drawing remains as the mark on the share image.
 */

const YAW = 0.4;
const PITCH = 0.16;
const CAM = 6.5;
/** Matches the renderer's fit: radius 1.15 ↔ min(30% height, 36% width). */
const WORLD = 1.15;

function project(p: readonly [number, number, number]) {
  const cy = Math.cos(YAW), sy = Math.sin(YAW);
  const cx = Math.cos(PITCH), sx = Math.sin(PITCH);
  const x1 = cy * p[0] + sy * p[2];
  const z1 = -sy * p[0] + cy * p[2];
  const y2 = cx * p[1] - sx * z1;
  const z2 = sx * p[1] + cx * z1;
  // A gentle perspective, like the camera's at this distance.
  const k = CAM / (CAM - z2 * 1.4);
  return [x1 * k, -y2 * k, z2] as const;
}

export const STILL_VIEWBOX = `${-WORLD * 1.3} ${-WORLD * 1.3} ${WORLD * 2.6} ${WORLD * 2.6}`;

/** The armature's members as two SVG path strings, split by depth. */
export function stillPaths() {
  const shape = buildArmature().shapes.armature;
  const pts = shape.positions.map(project);

  const near: string[] = [];
  const far: string[] = [];
  for (const [a, b] of shape.edges) {
    const pa = pts[a]!;
    const pb = pts[b]!;
    const d = `M${pa[0].toFixed(3)} ${pa[1].toFixed(3)}L${pb[0].toFixed(3)} ${pb[1].toFixed(3)}`;
    ((pa[2] + pb[2]) / 2 > 0 ? near : far).push(d);
  }
  return { near: near.join(""), far: far.join(""), viewBox: STILL_VIEWBOX };
}
