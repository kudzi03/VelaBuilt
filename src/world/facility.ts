/**
 * THE VELABUILT FACILITY.
 *
 * One building, walked end to end. Not a hub of labelled rooms with service
 * cards on the walls — that is a brochure with a camera in it. This is the
 * argument the studio actually makes, built at 1:1 and entered on foot:
 *
 *   an inquiry arrives, and a system carries it to a person who decides.
 *
 * The six halls ARE the six gates in src/content/signal-path.ts. The home
 * page draws them as a scroll; the fallback draws them as an SVG; here you
 * walk through them. One source, three renderings — change the journey and
 * all three follow.
 *
 * ── WHY THIS FILE HAS NO THREE.JS IN IT ──────────────────────────────────
 *
 * Four consumers read this spec and only one of them renders:
 *
 *   · the mesh builder          turns halls into walls, floors and fixtures
 *   · the collision solver      needs the same walls as slabs, not meshes
 *   · the context bridge        answers "which hall is the visitor in"
 *   · the voice guide           describes the room without loading a renderer
 *
 * Keeping it free of three.js means the guide and the collision solver cost
 * nothing on a device that never starts the canvas.
 *
 * ── SCALE ────────────────────────────────────────────────────────────────
 *
 * Metres, and real ones. Eye height 1.66. Doorways 2.1 high. Ceilings 3.4 in
 * the halls and 4.6 over the atrium. Corridors 2.4 wide — wide enough for two
 * people, narrow enough to feel like a building rather than a car park. These
 * numbers are the difference between a space that reads as architecture and
 * one that reads as a game level, and they are not adjustable for convenience.
 */

import { GATES } from "@/content/signal-path";

/* ── units ──────────────────────────────────────────────────────────────── */

export const EYE_HEIGHT = 1.66;
export const DOOR_HEIGHT = 2.1;
export const DOOR_WIDTH = 1.6;
export const WALL_THICKNESS = 0.22;
/** Radius of the player's collision cylinder. A shoulder, not a point. */
export const PLAYER_RADIUS = 0.34;

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/* ── what a hall is ─────────────────────────────────────────────────────── */

/**
 * A rectangular volume on the ground plane. Every hall is axis-aligned: the
 * facility is a designed building, not a cave, and axis alignment makes the
 * collision solver exact rather than approximate. The interest comes from
 * proportion, aperture, material and light — not from wonky walls.
 */
export interface Hall {
  readonly id: HallId;
  /** Centre on the ground plane. */
  readonly at: Vec2;
  /** Interior width (x) and depth (z). */
  readonly size: Vec2;
  readonly ceiling: number;
  /** Floor height. The facility steps down as you go deeper into it. */
  readonly floor: number;
  /** Shown in the HUD and spoken by the guide. */
  readonly name: string;
  /** One line. What this space is for, in the buyer's terms. */
  readonly line: string;
  /**
   * The gate in the signal path this hall embodies, when it is one of the
   * six. The atrium and the gallery are not gates.
   */
  readonly gate?: string;
  /** Where the route through the building enters this hall. */
  readonly entry: Vec2;
  /** Dominant light temperature in kelvin. Cool deep, warm at the ends. */
  readonly kelvin: number;
  /** Ambient bed for this hall — see src/world/audio.ts. */
  readonly tone: ToneId;
}

export type HallId =
  | "atrium"
  | "intake"
  | "records"
  | "sorting"
  | "cadence"
  | "gallery"
  | "decision";

export type ToneId = "air" | "server" | "quiet" | "mech" | "room";

/**
 * The plan.
 *
 * The building runs north along -z, stepping down 0.45 m at two points so the
 * visitor is always looking slightly into the next space rather than at a
 * flat wall. The gallery hangs off the spine to the west: work should be a
 * decision to go and look, not a corridor you are marched down.
 */
export const HALLS: readonly Hall[] = [
  {
    id: "atrium",
    at: [0, 0],
    size: [14, 16],
    ceiling: 4.6,
    floor: 0,
    name: "Arrival",
    line: "Where the inquiry comes in. Usually late, usually from a phone.",
    gate: "arrives",
    entry: [0, 6.4],
    kelvin: 3200,
    tone: "air",
  },
  {
    id: "intake",
    at: [0, -21],
    size: [11, 13],
    ceiling: 3.4,
    floor: 0,
    name: "Intake",
    line: "It becomes a record before it becomes a memory.",
    gate: "captured",
    entry: [0, -15],
    kelvin: 4000,
    tone: "server",
  },
  {
    id: "sorting",
    at: [0, -38],
    size: [13, 12],
    ceiling: 3.4,
    floor: -0.45,
    name: "Sorting",
    line: "Sorted on what it is, not on who happened to read it.",
    gate: "qualified",
    entry: [0, -32.5],
    kelvin: 4600,
    tone: "quiet",
  },
  {
    id: "records",
    at: [-16, -38],
    size: [10, 12],
    ceiling: 3.8,
    floor: -0.45,
    name: "The Gallery",
    line: "Work that is built and in use.",
    entry: [-11.5, -38],
    kelvin: 3000,
    tone: "room",
  },
  {
    id: "cadence",
    at: [0, -55],
    size: [12, 14],
    ceiling: 3.4,
    floor: -0.45,
    name: "Cadence",
    line: "Follow-up on a schedule that does not depend on anyone remembering.",
    gate: "followed-up",
    entry: [0, -48.5],
    kelvin: 4200,
    tone: "mech",
  },
  {
    id: "gallery",
    at: [0, -71],
    size: [11, 12],
    ceiling: 3.4,
    floor: -0.9,
    name: "Scheduling",
    line: "The right conversation reaches a calendar.",
    gate: "booked",
    entry: [0, -65.5],
    kelvin: 3600,
    tone: "quiet",
  },
  {
    id: "decision",
    at: [0, -88],
    size: [13, 14],
    ceiling: 4.2,
    floor: -0.9,
    name: "The Decision Room",
    line: "The part that should never have been automated.",
    gate: "decided",
    entry: [0, -81.5],
    kelvin: 2900,
    tone: "room",
  },
] as const;

export const HALL_BY_ID: Readonly<Record<HallId, Hall>> = Object.fromEntries(
  HALLS.map((h) => [h.id, h]),
) as Readonly<Record<HallId, Hall>>;

/* ── the links between them ─────────────────────────────────────────────── */

/**
 * A corridor is its own volume, so it collides and lights like a space rather
 * than being a hole punched in two walls. `axis` says which way it runs.
 */
export interface Link {
  readonly from: HallId;
  readonly to: HallId;
  readonly axis: "z" | "x";
  /** Centre line on the other axis. */
  readonly offset: number;
  readonly width: number;
  readonly ceiling: number;
}

export const LINKS: readonly Link[] = [
  { from: "atrium", to: "intake", axis: "z", offset: 0, width: 2.6, ceiling: 2.7 },
  { from: "intake", to: "sorting", axis: "z", offset: 0, width: 2.6, ceiling: 2.7 },
  { from: "sorting", to: "records", axis: "x", offset: -38, width: 2.4, ceiling: 2.7 },
  { from: "sorting", to: "cadence", axis: "z", offset: 0, width: 2.6, ceiling: 2.7 },
  { from: "cadence", to: "gallery", axis: "z", offset: 0, width: 2.6, ceiling: 2.7 },
  { from: "gallery", to: "decision", axis: "z", offset: 0, width: 2.8, ceiling: 2.9 },
] as const;

/* ── solids ─────────────────────────────────────────────────────────────── */

/**
 * An axis-aligned box the player cannot walk through. The mesh builder draws
 * these and the collision solver resolves against them — one list, so a wall
 * you can see is always a wall you can lean on, and there is no such thing as
 * invisible geometry that only one of them knows about.
 */
export interface Solid {
  /** Min corner. */
  readonly min: Vec3;
  /** Max corner. */
  readonly max: Vec3;
  /** Drawn as well as collided. Pure blockers (window reveals) are not. */
  readonly visible: boolean;
  readonly kind: SolidKind;
}

export type SolidKind = "wall" | "floor" | "ceiling" | "fixture" | "blocker";

const solid = (
  min: Vec3,
  max: Vec3,
  kind: SolidKind,
  visible = true,
): Solid => ({ min, max, kind, visible });

/** Interior bounds of a hall on the ground plane. */
export function hallBounds(h: Hall) {
  const [cx, cz] = h.at;
  const [w, d] = h.size;
  return {
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
  };
}

/** Interior bounds of a corridor on the ground plane. */
export function linkBounds(l: Link) {
  const a = HALL_BY_ID[l.from];
  const b = HALL_BY_ID[l.to];
  if (l.axis === "z") {
    const az = hallBounds(a);
    const bz = hallBounds(b);
    const from = Math.min(az.minZ, bz.minZ) === az.minZ ? az.minZ : bz.minZ;
    const to = Math.max(az.maxZ, bz.maxZ) === az.maxZ ? az.maxZ : bz.maxZ;
    // The corridor spans the gap between the two halls, not their interiors.
    const near = Math.max(Math.min(az.maxZ, bz.maxZ), Math.min(az.minZ, bz.minZ));
    const far = Math.min(Math.max(az.maxZ, bz.maxZ), Math.max(az.minZ, bz.minZ));
    void from;
    void to;
    return {
      minX: l.offset - l.width / 2,
      maxX: l.offset + l.width / 2,
      minZ: Math.min(near, far),
      maxZ: Math.max(near, far),
    };
  }
  const ax = hallBounds(a);
  const bx = hallBounds(b);
  const near = Math.max(Math.min(ax.maxX, bx.maxX), Math.min(ax.minX, bx.minX));
  const far = Math.min(Math.max(ax.maxX, bx.maxX), Math.max(ax.minX, bx.minX));
  return {
    minX: Math.min(near, far),
    maxX: Math.max(near, far),
    minZ: l.offset - l.width / 2,
    maxZ: l.offset + l.width / 2,
  };
}

/**
 * Every wall in the building, with doorway openings already subtracted.
 *
 * A wall with a doorway becomes three boxes — left of the opening, right of
 * it, and the lintel above it — rather than a wall plus a trigger volume the
 * player is teleported through. The opening is real, you can stand in it, and
 * the light from the next hall falls through it onto this floor.
 */
export function buildSolids(): readonly Solid[] {
  const out: Solid[] = [];
  const T = WALL_THICKNESS;

  /** Openings to cut, per hall wall, keyed by hall and side. */
  const cuts = new Map<string, { centre: number; width: number }[]>();
  const addCut = (hall: HallId, side: Side, centre: number, width: number) => {
    const k = `${hall}:${side}`;
    const list = cuts.get(k) ?? [];
    list.push({ centre, width });
    cuts.set(k, list);
  };

  for (const l of LINKS) {
    const a = HALL_BY_ID[l.from];
    const b = HALL_BY_ID[l.to];
    if (l.axis === "z") {
      // The corridor runs along z; it pierces the -z wall of whichever hall
      // sits nearer the origin and the +z wall of the other.
      const aNearer = a.at[1] > b.at[1];
      addCut(aNearer ? a.id : b.id, "back", l.offset, l.width);
      addCut(aNearer ? b.id : a.id, "front", l.offset, l.width);
    } else {
      const aRight = a.at[0] > b.at[0];
      addCut(aRight ? a.id : b.id, "left", l.offset, l.width);
      addCut(aRight ? b.id : a.id, "right", l.offset, l.width);
    }
  }

  for (const h of HALLS) {
    const bb = hallBounds(h);
    const y0 = h.floor;
    const y1 = h.floor + h.ceiling;
    out.push(solid([bb.minX - T, y0 - 0.4, bb.minZ - T], [bb.maxX + T, y0, bb.maxZ + T], "floor"));
    out.push(solid([bb.minX - T, y1, bb.minZ - T], [bb.maxX + T, y1 + T, bb.maxZ + T], "ceiling"));

    // Four walls, each cut by any doorways that pierce it.
    pushWall(out, h, "back", bb.minX, bb.maxX, bb.minZ - T, bb.minZ, cuts.get(`${h.id}:back`));
    pushWall(out, h, "front", bb.minX, bb.maxX, bb.maxZ, bb.maxZ + T, cuts.get(`${h.id}:front`));
    pushWall(out, h, "left", bb.minX - T, bb.minX, bb.minZ, bb.maxZ, cuts.get(`${h.id}:left`));
    pushWall(out, h, "right", bb.maxX, bb.maxX + T, bb.minZ, bb.maxZ, cuts.get(`${h.id}:right`));
  }

  for (const l of LINKS) {
    const lb = linkBounds(l);
    const a = HALL_BY_ID[l.from];
    const b = HALL_BY_ID[l.to];
    // The corridor floor ramps between two hall floors; the solver reads the
    // floor height from `floorAt`, so here we only need its shell.
    const lo = Math.min(a.floor, b.floor);
    const hi = Math.max(a.floor, b.floor);
    out.push(solid([lb.minX - T, lo - 0.4, lb.minZ], [lb.maxX + T, lo, lb.maxZ], "floor"));
    out.push(
      solid([lb.minX - T, hi + l.ceiling, lb.minZ], [lb.maxX + T, hi + l.ceiling + T, lb.maxZ], "ceiling"),
    );
    if (l.axis === "z") {
      out.push(solid([lb.minX - T, lo, lb.minZ], [lb.minX, hi + l.ceiling, lb.maxZ], "wall"));
      out.push(solid([lb.maxX, lo, lb.minZ], [lb.maxX + T, hi + l.ceiling, lb.maxZ], "wall"));
    } else {
      out.push(solid([lb.minX, lo, lb.minZ - T], [lb.maxX, hi + l.ceiling, lb.minZ], "wall"));
      out.push(solid([lb.minX, lo, lb.maxZ], [lb.maxX, hi + l.ceiling, lb.maxZ + T], "wall"));
    }
  }

  return out;
}

type Side = "back" | "front" | "left" | "right";

function pushWall(
  out: Solid[],
  h: Hall,
  side: Side,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  openings: { centre: number; width: number }[] | undefined,
): void {
  const y0 = h.floor;
  const y1 = h.floor + h.ceiling;
  const along: "x" | "z" = side === "back" || side === "front" ? "x" : "z";
  const lo = along === "x" ? x0 : z0;
  const hi = along === "x" ? x1 : z1;

  if (!openings?.length) {
    out.push(solid([x0, y0, z0], [x1, y1, z1], "wall"));
    return;
  }

  const sorted = [...openings].sort((a, b) => a.centre - b.centre);
  let cursor = lo;
  const head = y0 + DOOR_HEIGHT;

  for (const o of sorted) {
    const a = o.centre - o.width / 2;
    const b = o.centre + o.width / 2;
    if (a > cursor) {
      out.push(
        along === "x"
          ? solid([cursor, y0, z0], [a, y1, z1], "wall")
          : solid([x0, y0, cursor], [x1, y1, a], "wall"),
      );
    }
    // The lintel over the opening. Without it a doorway reads as a missing
    // wall rather than a door, and the ceiling appears to float.
    out.push(
      along === "x"
        ? solid([a, head, z0], [b, y1, z1], "wall")
        : solid([x0, head, a], [x1, y1, b], "wall"),
    );
    cursor = b;
  }
  if (cursor < hi) {
    out.push(
      along === "x"
        ? solid([cursor, y0, z0], [hi, y1, z1], "wall")
        : solid([x0, y0, cursor], [x1, y1, hi], "wall"),
    );
  }
}

/* ── where the visitor is ───────────────────────────────────────────────── */

const EPS = 0.001;

/** Which hall contains this ground position, if any. */
export function hallAt(x: number, z: number): Hall | null {
  for (const h of HALLS) {
    const b = hallBounds(h);
    if (x >= b.minX - EPS && x <= b.maxX + EPS && z >= b.minZ - EPS && z <= b.maxZ + EPS) return h;
  }
  return null;
}

/**
 * Floor height under a position, ramping smoothly through corridors that join
 * halls at different levels. Returns null when the position is outside the
 * building — the solver treats that as a wall it should never have reached.
 */
export function floorAt(x: number, z: number): number | null {
  const h = hallAt(x, z);
  if (h) return h.floor;

  for (const l of LINKS) {
    const b = linkBounds(l);
    if (x < b.minX - EPS || x > b.maxX + EPS || z < b.minZ - EPS || z > b.maxZ + EPS) continue;
    const a = HALL_BY_ID[l.from];
    const c = HALL_BY_ID[l.to];
    if (a.floor === c.floor) return a.floor;

    // Ramp across the corridor's long axis, from the hall it leaves to the
    // hall it reaches. smoothstep so the step is felt but never jolts.
    const span = l.axis === "z" ? [b.minZ, b.maxZ] : [b.minX, b.maxX];
    const pos = l.axis === "z" ? z : x;
    const aNearer =
      l.axis === "z" ? a.at[1] > c.at[1] : a.at[0] > c.at[0];
    let t = (pos - span[0]!) / Math.max(span[1]! - span[0]!, EPS);
    if (aNearer) t = 1 - t;
    const k = t * t * (3 - 2 * t);
    const from = aNearer ? c.floor : a.floor;
    const to = aNearer ? a.floor : c.floor;
    return from + (to - from) * k;
  }
  return null;
}

/** True when a ground position is anywhere inside the building. */
export const inside = (x: number, z: number): boolean => floorAt(x, z) !== null;

/* ── the route ──────────────────────────────────────────────────────────── */

/**
 * The order the building is meant to be walked in. Used by the guide when it
 * offers to take somebody somewhere, and by the mobile "next space" control,
 * which is how most phone visitors will actually move.
 */
export const ROUTE: readonly HallId[] = [
  "atrium",
  "intake",
  "sorting",
  "records",
  "cadence",
  "gallery",
  "decision",
] as const;

/** Spawn: just inside the entrance, facing into the building. */
export const SPAWN = {
  position: [0, 0, 6.2] as Vec3,
  /** Yaw in radians. 0 looks down -z, which is into the facility. */
  yaw: 0,
} as const;

/* ── the gates, resolved ────────────────────────────────────────────────── */

/**
 * The six signal-path gates with the hall each one is embodied by. This is the
 * join that keeps the walked world and the scrolled page telling the same
 * story: if a gate is added to the path and no hall claims it, this throws at
 * module load rather than quietly dropping a stage from the building.
 */
export const GATE_HALLS = GATES.map((g) => {
  const hall = HALLS.find((h) => h.gate === g.id);
  if (!hall) {
    throw new Error(
      `signal-path gate "${g.id}" has no hall in the facility. ` +
        `Add one to HALLS with gate: "${g.id}", or the walked world and the ` +
        `home page disagree about what the system does.`,
    );
  }
  return { gate: g, hall } as const;
});
