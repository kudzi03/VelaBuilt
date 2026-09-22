import { buildArmature } from "./geometry";

/**
 * The first frame, drawn on the server.
 *
 * The same armature the renderer animates, projected once to SVG at the pose
 * the renderer starts from. It is the object at first paint — before any
 * script — and it is the object for visitors without WebGL or on data saver.
 * The canvas fades in over it and it steps back.
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

export function VelaStill() {
  const { near, far } = stillPaths();

  return (
    <svg
      className="vela-still"
      viewBox={STILL_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="vela-still-core">
          <stop offset="0" stopColor="#140f0a" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#140f0a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#140f0a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vela-still-ember">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#f29a38" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f29a38" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="0.78" fill="url(#vela-still-core)" />
      <path d={far} stroke="#161512" strokeOpacity="0.22" strokeWidth="0.006" fill="none" />
      <path d={near} stroke="#161512" strokeOpacity="0.72" strokeWidth="0.007" fill="none" />
      <circle r="0.2" fill="url(#vela-still-ember)" />
    </svg>
  );
}
