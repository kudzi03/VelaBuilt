/**
 * THE ARMATURE — geometry.
 *
 * One set of nodes, six structures. The object never swaps models: the same
 * nodes re-seat themselves into each structure, and the members (edges)
 * belonging to the outgoing structure dissolve while the incoming ones form.
 * That is the whole visual idea — a system being rebuilt in front of you —
 * and it is why the topology lives here, as data, rather than in a mesh file.
 *
 * Pure and deterministic: no three.js, no DOM, a seeded generator. The server
 * renders the first frame as SVG from exactly this data, the WebGL renderer
 * animates it, and the tests assert its invariants — all three read the same
 * structure and cannot drift apart.
 */

export const SHAPES = ["armature", "planes", "aperture", "circuit", "lattice", "frame"] as const;
export type ShapeId = (typeof SHAPES)[number];

export type Vec3 = readonly [number, number, number];

export interface Structure {
  /** Node positions for this shape, indexed like every other shape. */
  readonly positions: readonly Vec3[];
  /** Members, as pairs of node indices. */
  readonly edges: readonly (readonly [number, number])[];
  /** Glass facets, as node index triples. */
  readonly faces: readonly (readonly [number, number, number])[];
}

export interface Armature {
  readonly count: number;
  /** Distance of each node from the centre in the armature, 0–1. Inner nodes carry the core. */
  readonly depth: readonly number[];
  readonly shapes: Readonly<Record<ShapeId, Structure>>;
}

/* ── seeded randomness ─────────────────────────────────────────────────── */

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const dist = (a: Vec3, b: Vec3) => len(sub(a, b));

/** k nearest neighbours within a point set → unique undirected edges. */
function knnEdges(points: readonly Vec3[], k: number, offset = 0, maxLen = Infinity) {
  const edges = new Set<string>();
  const out: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const near = points
      .map((p, j) => [j, dist(points[i]!, p)] as const)
      .filter(([j, d]) => j !== i && d <= maxLen)
      .sort((a, b) => a[1] - b[1])
      .slice(0, k);
    for (const [j] of near) {
      const a = Math.min(i, j) + offset;
      const b = Math.max(i, j) + offset;
      const key = `${a}:${b}`;
      if (!edges.has(key)) {
        edges.add(key);
        out.push([a, b]);
      }
    }
  }
  return out;
}

/** Triangles whose three sides are all members — the candidate glass panes. */
function trianglesOf(edges: readonly (readonly [number, number])[]) {
  const adj = new Map<number, Set<number>>();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  const tris: [number, number, number][] = [];
  for (const [a, b] of edges) {
    for (const c of adj.get(a)!) {
      if (c > b && adj.get(b)!.has(c)) tris.push([a, b, c]);
    }
  }
  return tris;
}

/* ── the node budget ───────────────────────────────────────────────────── */

/** 8 × 6 × 5: the lattice needs an exact box, and every other shape adapts. */
export const NODE_COUNT = 240;
const OUTER = 188;
const INNER = NODE_COUNT - OUTER;

/* ── shape generators (unordered point sets) ───────────────────────────── */

function armaturePoints(r: () => number): Vec3[] {
  const pts: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < OUTER; i++) {
    const y = 1 - (i / (OUTER - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    // Irregular on purpose: a hand-built space frame, not a mathematical ball.
    const shell = 1 + (r() - 0.5) * 0.2;
    pts.push([
      Math.cos(th) * rad * shell * 1.02,
      y * shell * 1.08,
      Math.sin(th) * rad * shell,
    ]);
  }
  for (let i = 0; i < INNER; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const rad = 0.22 + Math.pow(r(), 0.7) * 0.38;
    const s = Math.sqrt(1 - u * u);
    pts.push([Math.cos(th) * s * rad, u * rad, Math.sin(th) * s * rad]);
  }
  return pts;
}

const PLANE_COLS = 10;
const PLANE_ROWS = 6;

function planesPoints(r: () => number): Vec3[] {
  // Four interface layers pulled apart in depth — a website, exploded.
  const pts: Vec3[] = [];
  const cols = PLANE_COLS;
  const rows = PLANE_ROWS;
  for (let p = 0; p < 4; p++) {
    const z = -1.05 + p * 0.7;
    const ox = (p - 1.5) * 0.2;
    const oy = (1.5 - p) * 0.1;
    const w = 1.8 - p * 0.1;
    const h = 1.12 - p * 0.06;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        pts.push([
          ox + (i / (cols - 1) - 0.5) * w,
          oy + (j / (rows - 1) - 0.5) * h,
          z + (r() - 0.5) * 0.015,
        ]);
      }
    }
  }
  return pts;
}

const RING = 80;

function aperturePoints(r: () => number): Vec3[] {
  // A double ring around a live core: something that attends.
  const pts: Vec3[] = [];
  const ring = RING;
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2 + k * (Math.PI / ring);
      const rad = 1.12 - k * 0.14;
      pts.push([Math.cos(a) * rad, Math.sin(a) * rad, (k - 0.5) * 0.22]);
    }
  }
  const core = NODE_COUNT - ring * 2;
  for (let i = 0; i < core; i++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const rad = 0.12 + Math.pow(r(), 0.6) * 0.34;
    const s = Math.sqrt(1 - u * u);
    pts.push([Math.cos(th) * s * rad, u * rad, Math.sin(th) * s * rad * 0.8]);
  }
  return pts;
}

export const CIRCUIT_STAGES = 5;

function circuitPoints(r: () => number): Vec3[] {
  // Separate operations, placed along a path a workflow would take.
  const pts: Vec3[] = [];
  const per = Math.floor(NODE_COUNT / CIRCUIT_STAGES);
  for (let c = 0; c < CIRCUIT_STAGES; c++) {
    const t = c / (CIRCUIT_STAGES - 1);
    const cx = (t - 0.5) * 2.5;
    const cy = Math.sin(t * Math.PI * 1.2 - 0.3) * 0.45;
    const cz = Math.cos(t * Math.PI) * 0.35;
    const n = c === CIRCUIT_STAGES - 1 ? NODE_COUNT - per * (CIRCUIT_STAGES - 1) : per;
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const rad = 0.08 + Math.pow(r(), 0.5) * 0.2;
      const s = Math.sqrt(1 - u * u);
      pts.push([cx + Math.cos(th) * s * rad, cy + u * rad, cz + Math.sin(th) * s * rad]);
    }
  }
  return pts;
}

export const LATTICE = { x: 8, y: 6, z: 5 } as const;

function latticePoints(): Vec3[] {
  const pts: Vec3[] = [];
  const s = 0.3;
  for (let k = 0; k < LATTICE.z; k++) {
    for (let j = 0; j < LATTICE.y; j++) {
      for (let i = 0; i < LATTICE.x; i++) {
        pts.push([
          (i - (LATTICE.x - 1) / 2) * s,
          (j - (LATTICE.y - 1) / 2) * s,
          (k - (LATTICE.z - 1) / 2) * s,
        ]);
      }
    }
  }
  return pts;
}

const FRAME_ANCHORS = 26;

function framePoints(): Vec3[] {
  // Two rectangles in depth, braced: a frame to hold a piece of work. Nodes
  // share a few anchor points, so the frame reads as straight members rather
  // than a string of beads.
  const pts: Vec3[] = [];
  const perRect = NODE_COUNT / 2;
  const w = 2.3;
  const h = 1.44;
  const perim = 2 * (w + h);
  for (let k = 0; k < 2; k++) {
    const z = k === 0 ? 0.24 : -0.24;
    const scale = k === 0 ? 1 : 0.92;
    for (let i = 0; i < perRect; i++) {
      const anchor = Math.floor((i * FRAME_ANCHORS) / perRect);
      let d = (anchor / FRAME_ANCHORS) * perim;
      let x: number;
      let y: number;
      if (d < w) {
        x = -w / 2 + d;
        y = h / 2;
      } else if ((d -= w) < h) {
        x = w / 2;
        y = h / 2 - d;
      } else if ((d -= h) < w) {
        x = w / 2 - d;
        y = -h / 2;
      } else {
        d -= w;
        x = -w / 2;
        y = -h / 2 + d;
      }
      pts.push([x * scale, y * scale, z]);
    }
  }
  return pts;
}

/* ── edges and faces per shape ─────────────────────────────────────────── */

function armatureTopology(pts: readonly Vec3[]) {
  const outer = pts.slice(0, OUTER);
  const inner = pts.slice(OUTER);
  const edges: [number, number][] = [...knnEdges(outer, 5)];
  // Struts: each inner node ties to the shell and to its neighbours.
  inner.forEach((p, i) => {
    const idx = OUTER + i;
    const toShell = outer
      .map((q, j) => [j, dist(p, q)] as const)
      .sort((a, b) => a[1] - b[1]);
    edges.push([toShell[0]![0], idx]);
    if (i % 3 === 0) edges.push([toShell[1]![0], idx]);
  });
  edges.push(...knnEdges(inner, 2, OUTER));
  // A scattering of shell triangles glazed: glass panes in the frame.
  const faces = trianglesOf(edges.filter(([a, b]) => a < OUTER && b < OUTER)).filter(
    (_, i) => i % 7 === 3,
  );
  return { edges, faces };
}

function planesTopology() {
  // Each layer is drawn as a different part of an interface, back to front:
  // the grid it is laid on, the page structure, the content, the controls.
  const edges: [number, number][] = [];
  const faces: [number, number, number][] = [];
  const cols = PLANE_COLS;
  const rows = PLANE_ROWS;
  for (let p = 0; p < 4; p++) {
    const base = p * cols * rows;
    const at = (i: number, j: number) => base + j * cols + i;
    const h = (j: number, i0 = 0, i1 = cols - 1) => {
      for (let i = i0; i < i1; i++) edges.push([at(i, j), at(i + 1, j)]);
    };
    const v = (i: number, j0 = 0, j1 = rows - 1) => {
      for (let j = j0; j < j1; j++) edges.push([at(i, j), at(i, j + 1)]);
    };
    // Every layer has its frame.
    h(0);
    h(rows - 1);
    v(0);
    v(cols - 1);
    if (p === 0) {
      // The layout grid.
      for (let j = 1; j < rows - 1; j++) h(j);
      for (let i = 1; i < cols - 1; i++) v(i);
    } else if (p === 1) {
      // Page structure: header, a sidebar, a footer.
      h(rows - 2);
      h(1);
      v(3, 1, rows - 2);
    } else if (p === 2) {
      // Content blocks.
      h(3, 4, cols - 2);
      h(2, 4, cols - 2);
      v(4, 2, 3);
      v(cols - 2, 2, 3);
      h(4, 1, 3);
      v(1, 3, 4);
      v(3, 3, 4);
    } else {
      // A single control, brought forward.
      h(1, 6, 8);
      h(2, 6, 8);
      v(6, 1, 2);
      v(8, 1, 2);
    }
    // The pane itself — two triangles of glass.
    faces.push([at(0, 0), at(cols - 1, 0), at(cols - 1, rows - 1)]);
    faces.push([at(0, 0), at(cols - 1, rows - 1), at(0, rows - 1)]);
    // Corners joined through depth to the next layer.
    if (p < 3) {
      const next = (p + 1) * cols * rows;
      for (const [i, j] of [[0, 0], [cols - 1, 0], [0, rows - 1], [cols - 1, rows - 1]] as const) {
        edges.push([at(i, j), next + j * cols + i]);
      }
    }
  }
  return { edges, faces };
}

function apertureTopology(pts: readonly Vec3[]) {
  const ring = RING;
  const edges: [number, number][] = [];
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < ring; i++) {
      edges.push([k * ring + i, k * ring + ((i + 1) % ring)]);
    }
  }
  for (let i = 0; i < ring; i++) {
    edges.push([i, ring + i]);
    if (i % 2 === 0) edges.push([i, ring + ((i + 1) % ring)]);
  }
  const core = pts.slice(ring * 2);
  edges.push(...knnEdges(core, 3, ring * 2));
  // Spokes: the rim reports to the core.
  for (let i = 0; i < ring; i += 4) {
    const p = pts[ring + i]!;
    const nearest = core
      .map((q, j) => [j, dist(p, q)] as const)
      .sort((a, b) => a[1] - b[1])[0]![0];
    edges.push([ring + i, ring * 2 + nearest]);
  }
  const faces = trianglesOf(edges.filter(([a, b]) => a < ring * 2 && b < ring * 2)).filter(
    (_, i) => i % 5 === 0,
  );
  return { edges, faces };
}

function circuitTopology(pts: readonly Vec3[]) {
  const per = Math.floor(NODE_COUNT / CIRCUIT_STAGES);
  const edges: [number, number][] = [];
  const links: [number, number][] = [];
  for (let c = 0; c < CIRCUIT_STAGES; c++) {
    const start = c * per;
    const end = c === CIRCUIT_STAGES - 1 ? NODE_COUNT : start + per;
    edges.push(...knnEdges(pts.slice(start, end), 3, start));
    if (c < CIRCUIT_STAGES - 1) {
      // Two long connections between consecutive operations.
      const nextStart = end;
      const cA = pts.slice(start, end);
      const cB = pts.slice(nextStart, nextStart + per);
      const east = cA.map((p, i) => [i, p[0]] as const).sort((a, b) => b[1] - a[1]);
      const west = cB.map((p, i) => [i, p[0]] as const).sort((a, b) => a[1] - b[1]);
      links.push([start + east[0]![0], nextStart + west[0]![0]]);
      links.push([start + east[2]![0], nextStart + west[3]![0]]);
    }
  }
  edges.push(...links);
  return { edges, faces: [] as [number, number, number][], links };
}

function latticeTopology() {
  const { x: X, y: Y, z: Z } = LATTICE;
  const at = (i: number, j: number, k: number) => k * X * Y + j * X + i;
  const edges: [number, number][] = [];
  const faces: [number, number, number][] = [];
  for (let k = 0; k < Z; k++) {
    for (let j = 0; j < Y; j++) {
      for (let i = 0; i < X; i++) {
        const onFaceZ = k === 0 || k === Z - 1;
        if (i < X - 1 && (onFaceZ || j % 2 === 0)) edges.push([at(i, j, k), at(i + 1, j, k)]);
        if (j < Y - 1 && (onFaceZ || i % 2 === 0)) edges.push([at(i, j, k), at(i, j + 1, k)]);
        if (k < Z - 1 && (i % 7 === 0 || j % 5 === 0) && (i + j) % 2 === 0)
          edges.push([at(i, j, k), at(i, j, k + 1)]);
      }
    }
  }
  // A few glazed cells on the front face: rooms with the lights on.
  for (const [i, j] of [[1, 1], [2, 3], [5, 2], [4, 4], [6, 1]] as const) {
    faces.push([at(i, j, Z - 1), at(i + 1, j, Z - 1), at(i + 1, j + 1, Z - 1)]);
    faces.push([at(i, j, Z - 1), at(i + 1, j + 1, Z - 1), at(i, j + 1, Z - 1)]);
  }
  return { edges, faces };
}

function frameTopology() {
  const perRect = NODE_COUNT / 2;
  /** First node sitting on anchor k of rectangle r. */
  const at = (r: number, k: number) =>
    r * perRect + Math.ceil((((k % FRAME_ANCHORS) + FRAME_ANCHORS) % FRAME_ANCHORS) * perRect / FRAME_ANCHORS);
  const edges: [number, number][] = [];
  for (let r = 0; r < 2; r++) {
    for (let k = 0; k < FRAME_ANCHORS; k++) edges.push([at(r, k), at(r, k + 1)]);
  }
  for (let k = 0; k < FRAME_ANCHORS; k += 2) edges.push([at(0, k), at(1, k)]);
  for (let k = 1; k < FRAME_ANCHORS; k += 4) edges.push([at(0, k), at(1, k + 2)]);
  return { edges, faces: [] as [number, number, number][] };
}

/* ── ordering: make every shape agree on which node is which ───────────── */

/**
 * Re-orders a target point set so that node i in the armature travels to a
 * nearby-ish point in the target. Rank-matching on height then angle is not
 * an optimal assignment, but it keeps flows coherent — the top of the object
 * goes to the top of the next one — which is what the eye reads as intent.
 *
 * The permutation is returned too, because each shape's topology was built
 * against its own unordered indices and must be re-mapped to match.
 */
function rankKey(p: Vec3, bands: number) {
  const band = Math.round(((p[1] + 1.6) / 3.2) * bands);
  return band * 10 + (Math.atan2(p[2], p[0]) + Math.PI) / (Math.PI * 2);
}

function matchOrder(source: readonly Vec3[], target: readonly Vec3[]) {
  const bands = 12;
  const src = source.map((p, i) => [i, rankKey(p, bands)] as const).sort((a, b) => a[1] - b[1]);
  const dst = target.map((p, i) => [i, rankKey(p, bands)] as const).sort((a, b) => a[1] - b[1]);
  const ordered: Vec3[] = new Array(source.length);
  /** targetIndex → node index */
  const remap = new Array<number>(target.length);
  src.forEach(([nodeIndex], rank) => {
    const targetIndex = dst[rank]![0];
    ordered[nodeIndex] = target[targetIndex]!;
    remap[targetIndex] = nodeIndex;
  });
  return { ordered, remap };
}

function remapTopology(
  topo: {
    edges: readonly (readonly [number, number])[];
    faces: readonly (readonly [number, number, number])[];
  },
  remap: readonly number[],
) {
  return {
    edges: topo.edges.map(([a, b]) => [remap[a]!, remap[b]!] as const),
    faces: topo.faces.map(([a, b, c]) => [remap[a]!, remap[b]!, remap[c]!] as const),
  };
}

/* ── build ─────────────────────────────────────────────────────────────── */

let cached: Armature | null = null;

export function buildArmature(seed = 0x7e1a): Armature {
  if (cached && seed === 0x7e1a) return cached;
  const r = rng(seed);

  const base = armaturePoints(r);
  const baseTopo = armatureTopology(base);

  const shapes = {} as Record<ShapeId, Structure>;
  shapes.armature = { positions: base, ...baseTopo };

  const build = (
    id: ShapeId,
    points: Vec3[],
    topo: {
      edges: readonly (readonly [number, number])[];
      faces: readonly (readonly [number, number, number])[];
    },
  ) => {
    const { ordered, remap } = matchOrder(base, points);
    shapes[id] = { positions: ordered, ...remapTopology(topo, remap) };
  };

  build("planes", planesPoints(r), planesTopology());
  const ap = aperturePoints(r);
  build("aperture", ap, apertureTopology(ap));
  const ci = circuitPoints(r);
  build("circuit", ci, circuitTopology(ci));
  build("lattice", latticePoints(), latticeTopology());
  build("frame", framePoints(), frameTopology());

  const depth = base.map((p) => Math.min(1, len(p)));
  const armature: Armature = { count: NODE_COUNT, depth, shapes };
  if (seed === 0x7e1a) cached = armature;
  return armature;
}

/**
 * Every member across every shape, deduplicated, with a bitmask of which
 * shapes it belongs to. The renderer draws this union and fades each member
 * by how much of its shapes are currently present.
 */
export function unionEdges(armature: Armature) {
  const map = new Map<string, { a: number; b: number; mask: number }>();
  SHAPES.forEach((id, s) => {
    for (const [a0, b0] of armature.shapes[id].edges) {
      const a = Math.min(a0, b0);
      const b = Math.max(a0, b0);
      const key = `${a}:${b}`;
      const found = map.get(key);
      if (found) found.mask |= 1 << s;
      else map.set(key, { a, b, mask: 1 << s });
    }
  });
  return [...map.values()];
}

export function unionFaces(armature: Armature) {
  const out: { a: number; b: number; c: number; mask: number }[] = [];
  SHAPES.forEach((id, s) => {
    for (const [a, b, c] of armature.shapes[id].faces) out.push({ a, b, c, mask: 1 << s });
  });
  return out;
}
