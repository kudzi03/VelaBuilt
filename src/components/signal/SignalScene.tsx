"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GATES, PATH_END_Z, gateProgress } from "@/content/signal-path";
import { signal } from "@/lib/signal";
import type { Tier } from "@/lib/capability";

/**
 * THE SIGNAL, AND THE SYSTEM BUILT AROUND IT.
 *
 * An inquiry enters as a pulse of light. Ahead of it the structure is still
 * in pieces; as it arrives, each gate converges into alignment, the pulse
 * passes through, and the gate stays lit behind it. By the end of the page
 * the whole path is standing and lit — which is the product, drawn.
 *
 * Budget: three draw calls for the entire world. Every bar of every gate is
 * one InstancedMesh, the path is one tube, the pulse is one mesh. There is
 * no post-processing: bloom on a dark scene is the cheapest-looking thing in
 * real-time graphics, and emissive edges on near-black read brighter without
 * it.
 *
 * Rendering is on demand. A still page draws nothing at all.
 */

const CHAMPAGNE = new THREE.Color("#e0c398");
const CHAMPAGNE_DIM = new THREE.Color("#4d4234");
const STEEL = new THREE.Color("#26262e");

/** Half-extents of a gate opening. Wide enough to read as a doorway. */
const GATE_W = 1.35;
const GATE_H = 0.82;
const BAR = 0.055;

interface Placement {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly scale: THREE.Vector3;
  /** Where this bar sits before the gate assembles. */
  readonly scattered: THREE.Vector3;
  readonly scatterQuat: THREE.Quaternion;
  readonly gateIndex: number;
}

/**
 * Both states of every bar, computed once: aligned, and scattered. The frame
 * interpolates between them, so "assembly" is a lerp rather than a physics
 * simulation nobody can art-direct.
 */
function buildPlacements(): Placement[] {
  const out: Placement[] = [];
  const euler = new THREE.Euler();

  GATES.forEach((gate, gateIndex) => {
    const [gx, gy, gz] = gate.at;
    const centre = new THREE.Vector3(gx, gy, gz);
    euler.set(0, gate.turn, 0);
    const turn = new THREE.Quaternion().setFromEuler(euler);

    // left, right, top, bottom
    const bars: { offset: THREE.Vector3; scale: THREE.Vector3 }[] = [
      { offset: new THREE.Vector3(-GATE_W, 0, 0), scale: new THREE.Vector3(BAR, GATE_H * 2, BAR) },
      { offset: new THREE.Vector3(GATE_W, 0, 0), scale: new THREE.Vector3(BAR, GATE_H * 2, BAR) },
      { offset: new THREE.Vector3(0, GATE_H, 0), scale: new THREE.Vector3(GATE_W * 2 + BAR, BAR, BAR) },
      { offset: new THREE.Vector3(0, -GATE_H, 0), scale: new THREE.Vector3(GATE_W * 2 + BAR, BAR, BAR) },
    ];

    bars.forEach((bar, barIndex) => {
      const position = bar.offset.clone().applyQuaternion(turn).add(centre);

      // Scattered: pushed out along its own axis and rolled, so the gate
      // reads as parts waiting to be aligned rather than an explosion.
      const away = bar.offset.clone().normalize().multiplyScalar(0.42 + barIndex * 0.05);
      const scattered = position
        .clone()
        .add(away)
        .add(new THREE.Vector3(0, 0, 1.1 + (barIndex % 2) * 0.35));

      // Slight, deliberate misalignment: a part held a few degrees off true,
      // waiting to be set. Not tumbling.
      const scatterEuler = new THREE.Euler(
        (barIndex % 2 ? 1 : -1) * 0.16,
        gate.turn + (barIndex % 2 ? -0.2 : 0.17),
        (barIndex < 2 ? 1 : -1) * 0.13,
      );

      out.push({
        position,
        quaternion: turn.clone(),
        scale: bar.scale,
        scattered,
        scatterQuat: new THREE.Quaternion().setFromEuler(scatterEuler),
        gateIndex,
      });
    });
  });

  return out;
}

/**
 * A two-stop vertical gradient as an environment. Not a photograph, not an
 * HDRI download: just enough sky for a machined edge to pick up, so the metal
 * reads as metal instead of as a silhouette.
 */
function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const w = 16;
  const h = 64;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const t = y / (h - 1);
    // Cool graphite overhead falling to a warm champagne floor bounce.
    const r = THREE.MathUtils.lerp(38, 96, Math.pow(t, 1.7));
    const g = THREE.MathUtils.lerp(40, 80, Math.pow(t, 1.7));
    const b = THREE.MathUtils.lerp(48, 62, Math.pow(t, 1.7));
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  const source = new THREE.DataTexture(data, w, h);
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;
  source.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(source).texture;
  pmrem.dispose();
  source.dispose();
  return env;
}

/**
 * MeshStandardMaterial applies emissive uniformly, so with one InstancedMesh
 * every gate would light at once. Multiplying emissive by the instance colour
 * is the one line that lets a single draw call hold six gates in six
 * different states.
 */
function perInstanceEmissive(material: THREE.MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "vec3 totalEmissiveRadiance = emissive;",
      // vColor is a vec4 in three r186 — the instance alpha rides along with
      // it, so the swizzle is load-bearing rather than decorative.
      "vec3 totalEmissiveRadiance = emissive * vColor.rgb;",
    );
  };
  material.needsUpdate = true;
}

/** The curve the pulse and camera travel, as three.js understands it. */
function buildCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    GATES.map((g) => new THREE.Vector3(...g.at)),
    false,
    "catmullrom",
    0.5,
  );
}

/* -------------------------------------------------------------------------- */

function Structure({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => buildPlacements(), []);
  const curve = useMemo(() => buildCurve(), []);
  const { invalidate, camera } = useThree();

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      colour: new THREE.Color(),
      camAt: new THREE.Vector3(),
      lookAt: new THREE.Vector3(),
    }),
    [],
  );

  const pulse = useRef<THREE.Mesh>(null);
  const pathMaterial = useRef<THREE.ShaderMaterial>(null);
  const barMaterial = useRef<THREE.MeshStandardMaterial>(null);

  const { gl } = useThree();
  // Attached declaratively below rather than assigned onto the scene: R3F
  // owns that property, and reaching in to set it is what the compiler is
  // right to complain about.
  const environment = useMemo(() => buildEnvironment(gl), [gl]);
  useEffect(() => () => environment.dispose(), [environment]);

  useEffect(() => {
    if (barMaterial.current) perInstanceEmissive(barMaterial.current);
  }, []);

  useFrame(() => {
    const t = signal.progress;

    // ---- Camera: travels the path, offset so gates are seen at an angle.
    const ahead = Math.min(1, t + 0.06);
    curve.getPoint(t, scratch.camAt);
    curve.getPoint(ahead, scratch.lookAt);
    // Sit behind and slightly above the signal, drifting laterally with it.
    camera.position.set(
      scratch.camAt.x * 0.42 + 0.3,
      scratch.camAt.y + 0.72,
      scratch.camAt.z + 8.4,
    );
    camera.lookAt(scratch.lookAt.x * 0.5, scratch.lookAt.y + 0.18, scratch.lookAt.z - 6);

    // ---- Gates: converge as the signal reaches them, stay locked behind it.
    const instanced = mesh.current;
    if (instanced) {
      for (let i = 0; i < placements.length; i += 1) {
        const p = placements[i]!;
        const gateT = gateProgress(p.gateIndex);
        // Assembly happens over the stretch just before the gate, so the
        // structure is always building ahead of where the visitor is.
        const assembly = THREE.MathUtils.smoothstep(t, gateT - 0.17, gateT - 0.008);

        scratch.position.lerpVectors(p.scattered, p.position, assembly);
        scratch.quaternion.slerpQuaternions(p.scatterQuat, p.quaternion, assembly);
        scratch.matrix.compose(scratch.position, scratch.quaternion, p.scale);
        instanced.setMatrixAt(i, scratch.matrix);

        // Locked gates hold champagne; unbuilt ones are cold steel.
        const lock = THREE.MathUtils.smoothstep(t, gateT - 0.012, gateT + 0.03);
        scratch.colour.copy(STEEL).lerp(CHAMPAGNE_DIM, assembly).lerp(CHAMPAGNE, lock);
        instanced.setColorAt(i, scratch.colour);
      }
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    }

    // ---- The pulse: a short bright dash in the line, not a floating orb.
    if (pulse.current) {
      curve.getPoint(t, scratch.position);
      curve.getPoint(Math.min(1, t + 0.02), scratch.lookAt);
      pulse.current.position.copy(scratch.position);
      pulse.current.lookAt(scratch.lookAt);
      pulse.current.rotateX(Math.PI / 2);
    }

    // ---- The path lights up behind the pulse.
    const uProgress = pathMaterial.current?.uniforms.uProgress;
    if (uProgress) uProgress.value = t;

    // Keep drawing only while the run is on screen.
    if (signal.visible) invalidate();
  });

  const tubeSegments = tier === "A" ? 220 : 120;
  const radialSegments = tier === "A" ? 8 : 5;

  return (
    <>
      {/* One key light, low and to the side: this is machined metal, not a
          showroom. The pulse carries its own light as it travels. */}
      <primitive object={environment} attach="environment" />

      <ambientLight intensity={0.42} color="#8f8a80" />
      <directionalLight position={[-6, 5, 3]} intensity={1.9} color="#cfc6b6" />
      {/* Rim from behind the structure: an unbuilt gate is still an object,
          not a hole. */}
      <directionalLight position={[3, -2, -8]} intensity={0.5} color="#8a7f6d" />

      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, placements.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          ref={barMaterial}
          vertexColors
          metalness={0.42}
          roughness={0.34}
          emissive={CHAMPAGNE}
          emissiveIntensity={2.1}
          envMapIntensity={2.2}
          toneMapped={false}
        />
      </instancedMesh>

      <mesh>
        <tubeGeometry args={[curve, tubeSegments, 0.0075, radialSegments, false]} />
        <shaderMaterial
          ref={pathMaterial}
          transparent
          depthWrite={false}
          uniforms={{
            uProgress: { value: 0 },
            uLit: { value: CHAMPAGNE },
            uCold: { value: new THREE.Color("#221d17") },
          }}
          vertexShader={`
            varying float vT;
            void main() {
              vT = uv.x;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uProgress;
            uniform vec3 uLit;
            uniform vec3 uCold;
            varying float vT;
            void main() {
              // Behind the pulse the route is established; ahead it is faint.
              float lit = smoothstep(uProgress + 0.004, uProgress - 0.06, vT);
              vec3 c = mix(uCold, uLit, lit);
              gl_FragColor = vec4(c, mix(0.28, 1.0, lit));
            }
          `}
        />
      </mesh>

      <mesh ref={pulse}>
        <capsuleGeometry args={[0.032, 0.62, 3, 8]} />
        <meshBasicMaterial color={CHAMPAGNE} toneMapped={false} />
        {/* The inquiry lights the structure it is passing through. */}
        <pointLight color={CHAMPAGNE} intensity={3.2} distance={7} decay={2} />
      </mesh>
    </>
  );
}

/* -------------------------------------------------------------------------- */

export function SignalScene({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const dpr: [number, number] = tier === "A" ? [1, 2] : [1, 1.5];

  return (
    <Canvas
      // On demand: a page nobody is scrolling renders nothing.
      frameloop="demand"
      dpr={dpr}
      camera={{ fov: 34, near: 0.1, far: Math.abs(PATH_END_Z) + 40, position: [0.55, 1.15, 9.2] }}
      gl={{
        antialias: tier === "A",
        powerPreference: "high-performance",
        // A CPU rasteriser ran the previous scene at 3fps and delayed clicks
        // by seconds. Those devices get the drawn fallback instead.
        failIfMajorPerformanceCaveat: true,
        alpha: true,
      }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl, invalidate }) => {
        gl.setClearColor(0x000000, 0);
        signal.wake = invalidate;
        invalidate();
      }}
    >
      <Structure tier={tier} />
    </Canvas>
  );
}
