import * as THREE from "three";

/**
 * The material language of the VelaBuilt world.
 *
 * Four materials carry the whole corridor: lit black stone underfoot, thin
 * champagne seams, additive bloom quads, and black-glass interface panels.
 * Written by hand rather than assembled from lights and post-processing —
 * a corridor lit by emissive geometry costs a fraction of one lit by real
 * lights with a bloom pass, and holds its look on a mid-range phone.
 *
 * Colour note: with colour management on, `new THREE.Color("#rrggbb")` already
 * converts sRGB to the linear working space. Calling convertSRGBToLinear() on
 * top of that applies the transform twice and drags every value toward black —
 * so `worldColor` deliberately does nothing but construct the colour, and the
 * shaders end with <colorspace_fragment> to convert once on the way out.
 */

export const PALETTE = {
  void: "#050506",
  champagne: "#e0c398",
  champagneLight: "#f3e2c7",
  champagneDeep: "#8e7042",
  ivory: "#f2efe9",
  cold: "#7d8794",
} as const;

/** An authored sRGB hex, in three's linear working space. Converted once. */
export function worldColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export const FOG_DENSITY = 0.0115;
const FOG_COLOR = worldColor(PALETTE.void);

/** Shared exponential-squared fog, matched to the scene's own fog. */
const FOG_UNIFORMS = () => ({
  uFogColor: { value: FOG_COLOR.clone() },
  uFogDensity: { value: FOG_DENSITY },
});

const FOG_VERTEX = /* glsl */ `
  vDepth = -(modelViewMatrix * vec4(position, 1.0)).z;
`;

const FOG_FRAGMENT = /* glsl */ `
  float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  fogFactor = clamp(fogFactor, 0.0, 1.0);
`;

/* -------------------------------------------------------------------------- */
/* Floor — black stone with the corridor's light smeared into it               */
/* -------------------------------------------------------------------------- */

export interface FloorUniforms {
  uTime: { value: number };
  uAccent: { value: THREE.Color };
  uWallX: { value: number };
  uSeamSpacing: { value: number };
  uFogColor: { value: THREE.Color };
  uFogDensity: { value: number };
}

export function createFloorMaterial(wallX: number): THREE.ShaderMaterial {
  const uniforms: FloorUniforms = {
    uTime: { value: 0 },
    uAccent: { value: worldColor(PALETTE.champagne) },
    uWallX: { value: wallX },
    uSeamSpacing: { value: 14 },
    ...FOG_UNIFORMS(),
  };

  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying float vDepth;
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        ${FOG_VERTEX}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uAccent;
      uniform float uWallX;
      uniform float uSeamSpacing;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorld;
      varying float vDepth;

      void main() {
        float x = vWorld.x;
        float z = vWorld.z;

        // Base stone, marginally warmer toward the centre of the corridor.
        vec3 col = vec3(0.0055, 0.0055, 0.0068);

        // The wall seams, reflected: long streaks running with the corridor.
        float toWall = abs(abs(x) - uWallX);
        float wallStreak = exp(-toWall * toWall * 0.10);

        // The ceiling strip, reflected down the centre line.
        float centreStreak = exp(-x * x * 0.028) * 0.75;

        // Transverse floor seams at fixed intervals — architectural rhythm.
        float rowDist = abs(fract(z / uSeamSpacing + 0.5) - 0.5) * uSeamSpacing;
        float rowSeam = exp(-rowDist * rowDist * 2.2);

        float light = wallStreak * 0.85 + centreStreak * 0.5 + rowSeam * 0.5;

        // Break the polish so it reads as stone rather than plastic.
        float mottle = 0.82 + 0.18 * sin(x * 1.7 + z * 0.31) * sin(z * 0.13);
        col += uAccent * light * 0.5 * mottle;

        ${FOG_FRAGMENT}
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
    fog: false,
    depthWrite: true,
  });
}

/* -------------------------------------------------------------------------- */
/* Interface panel — black glass carrying a legible interface                  */
/* -------------------------------------------------------------------------- */

export interface PanelOptions {
  /** 0 = dormant and disconnected, 1 = fully live. */
  activity?: number;
  accent?: string;
  opacity?: number;
  /** Varies the generated interface content between panels. */
  seed?: number;
  rows?: number;
}

export function createPanelMaterial({
  activity = 0.35,
  accent = PALETTE.champagne,
  opacity = 0.94,
  seed = 0,
  rows = 9,
}: PanelOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uActivity: { value: activity },
      uAccent: { value: worldColor(accent) },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uRows: { value: rows },
      ...FOG_UNIFORMS(),
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        vUv = uv;
        ${FOG_VERTEX}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uActivity;
      uniform vec3 uAccent;
      uniform float uOpacity;
      uniform float uSeed;
      uniform float uRows;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec2 vUv;
      varying float vDepth;

      float hash(float n) { return fract(sin(n * 127.1 + 13.7) * 43758.5453); }

      void main() {
        vec2 uv = vUv;

        // Dark glass, lit slightly from above.
        vec3 col = vec3(0.018, 0.018, 0.023) + vec3(0.030, 0.030, 0.038) * pow(uv.y, 2.0);

        // Frame.
        float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
        float border = 1.0 - smoothstep(0.0, 0.0055, edge);
        col = mix(col, uAccent * (0.35 + 0.65 * uActivity), border * 0.9);

        // Header rule.
        float header = 1.0 - smoothstep(0.0, 0.0035, abs(uv.y - 0.845));
        col += uAccent * header * (0.30 + 0.55 * uActivity);

        // Generated interface content.
        float ri = floor(uv.y * uRows);
        float rowY = fract(uv.y * uRows);
        float h = hash(ri + uSeed * 7.13);
        float width = 0.22 + h * 0.56;
        float inRow = step(0.075, uv.x) * step(uv.x, 0.075 + width);
        float bar = inRow * (1.0 - smoothstep(0.10, 0.26, abs(rowY - 0.5)));
        bar *= step(uv.y, 0.80) * step(0.07, uv.y);
        col += uAccent * bar * (0.10 + 0.48 * uActivity) * (0.45 + 0.55 * h);

        // A single line of activity passing through a live panel.
        float scan = exp(-46.0 * abs(fract(uTime * 0.09 + uSeed * 0.37) - uv.y));
        col += uAccent * scan * 0.30 * uActivity;

        ${FOG_FRAGMENT}
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, uOpacity * (1.0 - fogFactor * 0.85));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
}

/* -------------------------------------------------------------------------- */
/* Seams and bloom                                                             */
/* -------------------------------------------------------------------------- */

/** Thin illuminated architectural seam. Unlit, so it costs almost nothing. */
export function createSeamMaterial(
  color: string = PALETTE.champagne,
  opacity = 0.9,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: worldColor(color),
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
    fog: true,
  });
}

/**
 * Additive falloff quad. Stands in for a bloom pass: the glow is authored
 * where it belongs rather than extracted from the frame afterwards, which
 * keeps the whole scene to a single render target.
 */
export function createGlowMaterial(
  color: string = PALETTE.champagne,
  strength = 0.5,
  /**
   * "radial" falls off from the centre in both directions — a point source.
   * "cross" falls off across the short axis only and stays constant along the
   * long one, which is what a seam running the length of a corridor does. A
   * radial falloff on a 390-metre strip lights its middle and abandons both
   * ends, so every long seam must use "cross".
   */
  falloff: "radial" | "cross" = "radial",
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: worldColor(color) },
      uStrength: { value: strength },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        ${
          falloff === "cross"
            ? `
        float d = (vUv.y - 0.5) * 2.0;
        float falloff = exp(-d * d * 4.2);
        // Fade the last few percent of each end so the strip has no hard stop.
        falloff *= smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);
        `
            : `
        vec2 v = (vUv - 0.5) * 2.0;
        float falloff = exp(-dot(v, v) * 3.4);
        `
        }
        gl_FragColor = vec4(uColor * falloff * uStrength, falloff);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
}

/** Dark architectural stone for walls, slabs and monoliths. */
export function createStoneMaterial(roughness = 0.62): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: worldColor("#070709"),
    roughness,
    metalness: 0.28,
  });
}
