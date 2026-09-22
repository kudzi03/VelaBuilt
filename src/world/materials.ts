/**
 * SURFACES.
 *
 * Every material here is generated at runtime from a few hundred bytes of
 * code. Nothing is downloaded.
 *
 * That is not a compromise, it is the point. A photoreal interior does not
 * come from 4K albedo maps — it comes from correct roughness, a believable
 * environment to reflect, and light that falls off properly. An 80 MB texture
 * set would buy grain we do not need and cost the visitor the first fifteen
 * seconds of the experience, which is the entire experience for most of them.
 *
 * What the surfaces actually need is *variation*: a floor with one uniform
 * roughness reads as plastic under any light. So each material gets a small
 * procedural roughness map — value noise, 256², built on a canvas — that
 * breaks up the specular without ever being visible as a pattern.
 *
 * ── ENVIRONMENT ──────────────────────────────────────────────────────────
 *
 * PBR without an environment map is matte and dead: metal goes black, and
 * every dielectric loses its sheen. We build one from a gradient scene and
 * pre-filter it with PMREM, which is a few milliseconds and about 400 KB of
 * GPU memory. It is the single highest-value thing in this file.
 *
 * ── COLOUR ───────────────────────────────────────────────────────────────
 *
 * Taken from the site's own tokens, not invented: near-black grounds, a
 * champagne accent, cool steel. The world and the page are the same studio.
 */

import * as THREE from "three";

/** Straight from globals.css. The world is not allowed its own palette. */
export const PALETTE = {
  champagne: 0xe0c398,
  champagneDim: 0x4d4234,
  steel: 0x26262e,
  ink: 0x0a0a0c,
  plaster: 0x1a1a1f,
  concrete: 0x2a2a30,
  glass: 0x0e0e12,
} as const;

/* ── procedural maps ────────────────────────────────────────────────────── */

/**
 * Tileable value noise on a canvas, returned as a repeating texture.
 *
 * Deliberately low-frequency and low-contrast. The job is to stop a surface
 * reading as a single specular value across ten metres; the moment the noise
 * is legible as noise it has overshot and started to look like a video game
 * detail texture.
 */
function noiseTexture(size: number, octaves: number, contrast: number): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  // Seeded so every reload produces the same building. A floor that changes
  // its grain between visits is a floor nobody believes in.
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100000) / 100000;
  };

  const layers: number[][] = [];
  for (let o = 0; o < octaves; o++) {
    const n = 4 << o;
    const grid: number[] = [];
    for (let i = 0; i < n * n; i++) grid.push(rand());
    layers.push(grid);
  }

  const sample = (grid: number[], n: number, u: number, v: number): number => {
    // Wrapped bilinear — the wrap is what makes the result tile.
    const x = u * n;
    const y = v * n;
    const x0 = Math.floor(x) % n;
    const y0 = Math.floor(y) % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = grid[y0 * n + x0]!;
    const b = grid[y0 * n + x1]!;
    const cc = grid[y1 * n + x0]!;
    const d = grid[y1 * n + x1]!;
    return (a + (b - a) * sx) * (1 - sy) + (cc + (d - cc) * sx) * sy;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let n = 0;
      let amp = 1;
      let total = 0;
      for (let o = 0; o < octaves; o++) {
        n += sample(layers[o]!, 4 << o, u, v) * amp;
        total += amp;
        amp *= 0.5;
      }
      n /= total;
      const value = 128 + (n - 0.5) * 255 * contrast;
      const i = (y * size + x) * 4;
      img.data[i] = value;
      img.data[i + 1] = value;
      img.data[i + 2] = value;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ── the environment ────────────────────────────────────────────────────── */

/**
 * A pre-filtered environment from a tiny gradient scene: dark floor, slightly
 * lifted walls, a cool band where a ceiling cove would be. Everything metal
 * in the building reflects this, which is the difference between "metal" and
 * "grey plastic".
 */
export function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(12, 7, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        floor: { value: new THREE.Color(0x07070a) },
        mid: { value: new THREE.Color(0x1d1d24) },
        cove: { value: new THREE.Color(0x5a5140) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 floor; uniform vec3 mid; uniform vec3 cove;
        varying vec3 vPos;
        void main() {
          float h = clamp(vPos.y / 3.5 * 0.5 + 0.5, 0.0, 1.0);
          vec3 c = mix(floor, mid, smoothstep(0.0, 0.55, h));
          // A warm band near the top, where a cove light would sit.
          c = mix(c, cove, smoothstep(0.78, 0.96, h) * 0.55);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(shell);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(scene, 0.04);
  pmrem.dispose();
  shell.geometry.dispose();
  (shell.material as THREE.Material).dispose();
  return target.texture;
}

/* ── the material set ───────────────────────────────────────────────────── */

export interface Surfaces {
  readonly floor: THREE.MeshStandardMaterial;
  readonly wall: THREE.MeshStandardMaterial;
  readonly ceiling: THREE.MeshStandardMaterial;
  readonly metal: THREE.MeshStandardMaterial;
  readonly glass: THREE.MeshPhysicalMaterial;
  readonly emissive: THREE.MeshBasicMaterial;
  readonly accent: THREE.MeshStandardMaterial;
  dispose(): void;
}

export function buildSurfaces(env: THREE.Texture): Surfaces {
  const grain = noiseTexture(256, 4, 0.5);
  const fine = noiseTexture(256, 5, 0.32);

  const floorRough = grain.clone();
  floorRough.needsUpdate = true;
  floorRough.repeat.set(9, 9);

  const wallRough = fine.clone();
  wallRough.needsUpdate = true;
  wallRough.repeat.set(5, 3);

  // Polished concrete: dark, fairly smooth, and it is the smoothness that
  // does the work — it catches the ceiling coves and drags them down the room.
  const floor = new THREE.MeshStandardMaterial({
    color: PALETTE.concrete,
    roughness: 0.38,
    metalness: 0.04,
    roughnessMap: floorRough,
    envMap: env,
    envMapIntensity: 0.85,
  });

  // Deep plaster. Nearly matte, so it holds the light gradient rather than
  // throwing highlights and flattening the room.
  const wall = new THREE.MeshStandardMaterial({
    color: PALETTE.plaster,
    roughness: 0.92,
    metalness: 0.0,
    roughnessMap: wallRough,
    envMap: env,
    envMapIntensity: 0.4,
  });

  const ceiling = new THREE.MeshStandardMaterial({
    color: PALETTE.ink,
    roughness: 0.96,
    metalness: 0.0,
    envMap: env,
    envMapIntensity: 0.22,
  });

  const metal = new THREE.MeshStandardMaterial({
    color: 0x8e8e96,
    roughness: 0.31,
    metalness: 1.0,
    roughnessMap: fine,
    envMap: env,
    envMapIntensity: 1.0,
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: PALETTE.glass,
    roughness: 0.06,
    metalness: 0.0,
    transmission: 0.0,
    // Real transmission is a second render pass per glass surface. At this
    // scale a very smooth, very dark dielectric reads as glass for a fraction
    // of the cost, and never smears the room behind it.
    opacity: 0.42,
    transparent: true,
    envMap: env,
    envMapIntensity: 1.4,
    reflectivity: 0.6,
  });

  const accent = new THREE.MeshStandardMaterial({
    color: PALETTE.champagne,
    roughness: 0.42,
    metalness: 0.85,
    envMap: env,
    envMapIntensity: 1.1,
  });

  // Light sources you can see. Basic, not standard: a visible luminaire must
  // not itself be lit, or it goes grey in the dark halls.
  const emissive = new THREE.MeshBasicMaterial({ color: 0xffe8c8 });

  return {
    floor,
    wall,
    ceiling,
    metal,
    glass,
    emissive,
    accent,
    dispose() {
      for (const m of [floor, wall, ceiling, metal, glass, emissive, accent]) m.dispose();
      for (const t of [grain, fine, floorRough, wallRough]) t.dispose();
    },
  };
}

/** Kelvin to a linear RGB colour, for luminaire tint per hall. */
export function kelvin(k: number): THREE.Color {
  const t = k / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  return new THREE.Color(
    clamp01(r / 255),
    clamp01(g / 255),
    clamp01(b / 255),
  ).convertSRGBToLinear();
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
