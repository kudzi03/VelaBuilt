/**
 * BUILDING THE BUILDING.
 *
 * Turns the facility spec into meshes and lights. Two rules run through it:
 *
 *   1. Batch ruthlessly. Every wall in the facility is one InstancedMesh.
 *      Every floor slab is another. The whole shell is about six draw calls,
 *      which is what makes this run on a phone.
 *
 *   2. Light the architecture, not the objects. There is no key light on a
 *      hero prop anywhere. Each hall has a cove — a long emissive strip near
 *      the ceiling with a matching light below it — so the room is lit the way
 *      a real room with concealed lighting is lit, and the floor's reflection
 *      of that strip does half the work.
 *
 * ── SHADOWS ──────────────────────────────────────────────────────────────
 *
 * One shadow-casting light, and it follows the visitor to whichever hall they
 * are in. Six shadow maps for six halls is six render passes per frame for
 * five rooms nobody is standing in. Moving one map costs one.
 *
 * ── WHAT IS NOT HERE ─────────────────────────────────────────────────────
 *
 * No bloom, no god rays, no lens dirt. On a near-black interior, bloom is the
 * cheapest-looking effect in real-time graphics and it eats the contrast that
 * makes the halls feel deep. Emissive strips at slightly above 1.0 against
 * a dark plaster wall read as bright without a single post pass.
 */

import * as THREE from "three";
import {
  DOOR_HEIGHT,
  HALLS,
  LINKS,
  WALL_THICKNESS,
  buildSolids,
  linkBounds,
  type Hall,
} from "./facility";
import { kelvin, type Surfaces } from "./materials";

export interface World {
  readonly root: THREE.Group;
  /** Move the single shadow light to the hall the visitor is in. */
  focusHall(h: Hall | null): void;
  /**
   * Advance anything that moves. Owned here rather than in the React
   * component so the scene graph is only ever mutated by the module that
   * built it — the renderer never reaches into three.js at all.
   */
  tick(seconds: number, animate: boolean): void;
  dispose(): void;
}

const box = new THREE.BoxGeometry(1, 1, 1);
const plane = new THREE.PlaneGeometry(1, 1);

export function buildWorld(surfaces: Surfaces, quality: "high" | "low"): World {
  const root = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];

  /* ── the shell, in three instanced batches ───────────────────────────── */

  const solids = buildSolids().filter((s) => s.visible);
  const groups = {
    wall: solids.filter((s) => s.kind === "wall"),
    floor: solids.filter((s) => s.kind === "floor"),
    ceiling: solids.filter((s) => s.kind === "ceiling"),
  };

  const m4 = new THREE.Matrix4();
  for (const [kind, list] of Object.entries(groups) as Array<
    ["wall" | "floor" | "ceiling", typeof solids]
  >) {
    if (!list.length) continue;
    const mat =
      kind === "wall" ? surfaces.wall : kind === "floor" ? surfaces.floor : surfaces.ceiling;
    const mesh = new THREE.InstancedMesh(box, mat, list.length);
    mesh.castShadow = kind === "wall" && quality === "high";
    mesh.receiveShadow = quality === "high";
    list.forEach((s, i) => {
      m4.makeScale(
        Math.max(s.max[0] - s.min[0], 0.001),
        Math.max(s.max[1] - s.min[1], 0.001),
        Math.max(s.max[2] - s.min[2], 0.001),
      );
      m4.setPosition(
        (s.min[0] + s.max[0]) / 2,
        (s.min[1] + s.max[1]) / 2,
        (s.min[2] + s.max[2]) / 2,
      );
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    // The shell is the whole building; culling its single bounding volume
    // would pop the entire world out of view when the camera is inside it.
    mesh.frustumCulled = false;
    root.add(mesh);
  }

  /* ── coves ───────────────────────────────────────────────────────────── */

  /**
   * Each hall gets two strips running its long axis, set 0.35 m below the
   * ceiling and 0.5 m off the wall. The strip is visible geometry; the light
   * under it is what actually falls on the floor. Real coves work exactly
   * this way and the eye knows it even when it cannot say why.
   */
  const coveLights: THREE.PointLight[] = [];
  for (const h of HALLS) {
    const y = h.floor + h.ceiling - 0.35;
    const tint = kelvin(h.kelvin);
    const long = h.size[1] >= h.size[0];
    const length = (long ? h.size[1] : h.size[0]) - 1.4;
    const offset = (long ? h.size[0] : h.size[1]) / 2 - 0.5;

    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(plane, surfaces.emissive.clone());
      const mat = strip.material as THREE.MeshBasicMaterial;
      mat.color = tint.clone().multiplyScalar(1.25);
      disposables.push(mat);
      strip.scale.set(long ? 0.09 : length, long ? length : 0.09, 1);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(
        long ? h.at[0] + side * offset : h.at[0],
        y,
        long ? h.at[1] : h.at[1] + side * offset,
      );
      root.add(strip);

      /**
       * Lamps along the strip, not one in the middle of it.
       *
       * The first pass used three per strip sitting hard against the wall and
       * it read as three glowing blobs — the giveaway that a room is lit by
       * point lights rather than by a cove. Five, spaced along the run and
       * pulled 0.55 m off the wall, overlap into a continuous wash instead.
       *
       * Decay is 1.4 rather than the physical 2. A true inverse-square
       * falloff from a strip this close to a wall blows out the plaster
       * beside it and leaves the middle of the floor black, because the real
       * fixture is a two-metre line and this is a point standing in for one.
       */
      const lamps = quality === "high" ? 5 : 3;
      for (let i = 0; i < lamps; i++) {
        const t = i / (lamps - 1);
        const along = -length / 2 + length * t;
        const light = new THREE.PointLight(tint, 0, 16, 1.4);
        const inset = side * (offset - 0.55);
        light.position.set(
          long ? h.at[0] + inset : h.at[0] + along,
          y - 0.2,
          long ? h.at[1] + along : h.at[1] + inset,
        );
        light.userData.baseIntensity = quality === "high" ? 7.5 : 11;
        light.intensity = light.userData.baseIntensity as number;
        root.add(light);
        coveLights.push(light);
      }
    }

    // A low fill so the floor never reaches pure black in the corners. Cheap,
    // and it is what stops the halls reading as a void with furniture in it.
    // At 0.16 the mid-floor was still crushing to black between the coves.
    const fill = new THREE.HemisphereLight(tint, 0x0a0a10, 0.42);
    fill.position.set(h.at[0], h.floor + h.ceiling, h.at[1]);
    root.add(fill);
  }

  /* ── doorway reveals ─────────────────────────────────────────────────── */

  // A warm line at the head of each opening. It reads as a threshold, and it
  // is what draws the eye down the building from the atrium.
  for (const l of LINKS) {
    const b = linkBounds(l);
    for (const end of [0, 1]) {
      const bar = new THREE.Mesh(box, surfaces.accent);
      if (l.axis === "z") {
        bar.scale.set(l.width, 0.035, 0.05);
        bar.position.set(l.offset, DOOR_HEIGHT - 0.02, end ? b.maxZ : b.minZ);
      } else {
        bar.scale.set(0.05, 0.035, l.width);
        bar.position.set(end ? b.maxX : b.minX, DOOR_HEIGHT - 0.47, l.offset);
      }
      root.add(bar);
    }
  }

  /* ── fixtures ────────────────────────────────────────────────────────── */

  for (const h of HALLS) addFixtures(root, h, surfaces, quality, disposables);

  /* ── the one shadow light ────────────────────────────────────────────── */

  let shadow: THREE.SpotLight | null = null;
  if (quality === "high") {
    shadow = new THREE.SpotLight(0xfff0d8, 22, 26, Math.PI / 3.1, 0.75, 1.5);
    shadow.castShadow = true;
    shadow.shadow.mapSize.set(1024, 1024);
    shadow.shadow.bias = -0.0015;
    shadow.shadow.normalBias = 0.035;
    shadow.shadow.camera.near = 0.6;
    shadow.shadow.camera.far = 26;
    shadow.position.set(0, 4.2, 0);
    shadow.target.position.set(0, 0, 0);
    root.add(shadow, shadow.target);
  }

  const pendulums: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name === "pendulum") pendulums.push(o);
  });

  return {
    root,
    tick(seconds, animate) {
      if (!animate) return;
      for (const g of pendulums) {
        const phase = (g.userData.phase as number) ?? 0;
        g.rotation.z = Math.sin(seconds * 0.7 + phase) * 0.11;
      }
    },
    focusHall(h) {
      if (!shadow) return;
      if (!h) {
        shadow.intensity = 0;
        return;
      }
      shadow.intensity = 22;
      shadow.position.set(h.at[0], h.floor + h.ceiling - 0.25, h.at[1]);
      shadow.target.position.set(h.at[0], h.floor, h.at[1]);
      shadow.target.updateMatrixWorld();
    },
    dispose() {
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry && mesh.geometry !== box && mesh.geometry !== plane) {
          mesh.geometry.dispose();
        }
      });
      for (const d of disposables) d.dispose();
      root.clear();
    },
  };
}

/* ── what is actually in the rooms ──────────────────────────────────────── */

/**
 * Fixtures are architecture, not props: a bench, a table, a run of racks, a
 * plinth. Nothing floats, nothing spins, nothing glows for its own sake.
 * Every one of them is a box or a cylinder, instanced where it repeats, and
 * every one of them is also a collider — see facility.ts, which reads the
 * same list. You cannot walk through the table.
 */
function addFixtures(
  root: THREE.Group,
  h: Hall,
  s: Surfaces,
  quality: "high" | "low",
  disposables: Array<{ dispose(): void }>,
): void {
  const y = h.floor;
  const put = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number],
    scale: [number, number, number] = [1, 1, 1],
    rotY = 0,
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.scale.set(scale[0], scale[1], scale[2]);
    m.rotation.y = rotY;
    m.castShadow = quality === "high";
    m.receiveShadow = quality === "high";
    root.add(m);
    return m;
  };

  switch (h.id) {
    case "atrium": {
      // A single long reception slab, off-centre. The room's emptiness is the
      // point — arrival should feel like air, not like a lobby full of sofas.
      put(box, s.metal, [-3.4, y + 0.46, -2.2], [3.6, 0.09, 1.0]);
      put(box, s.wall, [-3.4, y + 0.22, -2.2], [3.4, 0.44, 0.86]);
      // The studio mark, cut into the far wall as a recessed champagne line.
      put(box, s.accent, [0, y + 2.5, -7.9], [2.2, 0.02, 0.02]);
      break;
    }
    case "intake": {
      // Racks. Six bays, instanced, running the long wall. This is the room
      // where an inquiry stops being a memory, so it looks like storage.
      const bay = new THREE.InstancedMesh(box, s.metal, 12);
      const m4 = new THREE.Matrix4();
      let i = 0;
      for (let r = 0; r < 6; r++) {
        for (const side of [-1, 1]) {
          m4.makeScale(0.62, 2.05, 0.9);
          m4.setPosition(side * 4.3, y + 1.02, -21 - 4.6 + r * 1.85);
          bay.setMatrixAt(i++, m4);
        }
      }
      bay.instanceMatrix.needsUpdate = true;
      bay.castShadow = quality === "high";
      bay.frustumCulled = false;
      root.add(bay);

      // Status lines on the racks — a real thing in a real rack room, and the
      // only place in the building anything blinks.
      const lines = new THREE.InstancedMesh(box, s.emissive, 12);
      const lm = new THREE.MeshBasicMaterial({ color: kelvin(5200).multiplyScalar(1.1) });
      lines.material = lm;
      disposables.push(lm);
      i = 0;
      for (let r = 0; r < 6; r++) {
        for (const side of [-1, 1]) {
          m4.makeScale(0.015, 0.9, 0.02);
          m4.setPosition(side * 3.98, y + 1.15, -21 - 4.6 + r * 1.85);
          lines.setMatrixAt(i++, m4);
        }
      }
      lines.instanceMatrix.needsUpdate = true;
      lines.frustumCulled = false;
      root.add(lines);
      break;
    }
    case "sorting": {
      // A long table down the middle with a glass surface. Sorting is a thing
      // done on a table, and the glass picks up the coves overhead.
      put(box, s.metal, [0, y + 0.72, -38], [1.5, 0.06, 6.4]);
      put(box, s.wall, [0, y + 0.36, -38], [1.3, 0.68, 6.1]);
      put(plane, s.glass, [0, y + 0.755, -38], [1.44, 6.34, 1], 0).rotation.x = -Math.PI / 2;
      break;
    }
    case "records": {
      // The gallery: plinths, waiting for work to stand on them. What goes on
      // them comes from src/content/work.ts at mount time — this only builds
      // the furniture, so a plinth is never left showing an invented project.
      for (let i = 0; i < 3; i++) {
        const z = -38 - 3.6 + i * 3.6;
        put(box, s.wall, [-16 + 3.1, y + 0.55, z], [0.5, 1.1, 2.0]);
        put(box, s.metal, [-16 + 3.1, y + 1.11, z], [0.56, 0.03, 2.06]);
      }
      break;
    }
    case "cadence": {
      // Twelve pendulums on a slow phase offset. The only moving thing in the
      // building, because cadence is the one idea here that IS movement — and
      // they are driven by the frame clock, not by a physics solver.
      const arm = new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6);
      disposables.push(arm);
      const bobGeo = new THREE.SphereGeometry(0.07, 12, 8);
      disposables.push(bobGeo);
      for (let i = 0; i < 12; i++) {
        const x = -2.75 + (i % 6) * 1.1;
        const z = -55 + (i < 6 ? -1.6 : 1.6);
        const g = new THREE.Group();
        g.position.set(x, y + h.ceiling - 0.6, z);
        const a = new THREE.Mesh(arm, s.metal);
        a.position.y = -0.75;
        const b = new THREE.Mesh(bobGeo, s.accent);
        b.position.y = -1.5;
        b.castShadow = quality === "high";
        g.add(a, b);
        g.userData.phase = i * 0.42;
        g.name = "pendulum";
        root.add(g);
      }
      break;
    }
    case "gallery": {
      // Scheduling: a wall of shallow recesses, like a week laid out. Reads
      // as a calendar without a single number on it.
      const cell = new THREE.InstancedMesh(box, s.wall, 35);
      const m4 = new THREE.Matrix4();
      let i = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          m4.makeScale(0.46, 0.3, 0.06);
          m4.setPosition(-2.4 + c * 0.8, y + 1.1 + r * 0.42, -71 - 5.9);
          cell.setMatrixAt(i++, m4);
        }
      }
      cell.instanceMatrix.needsUpdate = true;
      cell.frustumCulled = false;
      root.add(cell);
      break;
    }
    case "decision": {
      // One table, two chairs, warm light. The room the whole building leads
      // to, and the least technological space in it — which is the argument.
      put(box, s.metal, [0, y + 0.74, -88], [2.4, 0.05, 1.3]);
      const leg = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8);
      disposables.push(leg);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          put(leg, s.metal, [sx * 1.05, y + 0.37, -88 + sz * 0.5]);
        }
      }
      for (const sz of [-1, 1]) {
        put(box, s.wall, [0, y + 0.44, -88 + sz * 1.35], [0.52, 0.06, 0.5]);
        put(box, s.wall, [0, y + 0.7, -88 + sz * 1.58], [0.52, 0.52, 0.06]);
      }
      break;
    }
  }
  void WALL_THICKNESS;
}
