"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp01, journey } from "@/lib/journey";
import type { Tier } from "@/lib/capability";
import { Corridor } from "./world/Corridor";
import { Operator } from "./world/Operator";
import { Stations } from "./world/Stations";
import { MaterialClock } from "./world/primitives";
import { cameraPosition, lookTarget } from "./world/path";
import {
  createGlowMaterial,
  FOG_DENSITY,
  worldColor,
  PALETTE,
} from "./world/materials";

/**
 * THE 3D LAYER.
 *
 * Loaded only after the page is interactive, only on capable devices, and
 * always behind semantic HTML that already said everything this scene shows.
 * If this file never loads, the site is complete without it.
 *
 * Performance decisions worth knowing:
 *   · `frameloop="demand"` — frames are rendered when the journey moves, not
 *     sixty times a second while the visitor reads.
 *   · No post-processing. Glow is authored as additive geometry, so the whole
 *     scene is one pass to one target.
 *   · No shadow maps. The corridor is lit by emissive architecture.
 *   · Three lights total, all cheap, one of which travels with the camera.
 *   · DPR is capped by tier, and the renderer is told never to exceed it.
 */

export function WorldCanvas({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const dpr: [number, number] = tier === "A" ? [1, 1.85] : [1, 1.4];

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      frameloop="demand"
      gl={{
        antialias: tier === "A",
        alpha: true,
        powerPreference: "high-performance",
        // The corridor is nearly black; a depth buffer fight would show.
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 40, near: 0.1, far: 420, position: [0, 1.78, 12] }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
        scene.fog = new THREE.FogExp2(PALETTE.void, FOG_DENSITY);
      }}
    >
      <SceneContents tier={tier} />
    </Canvas>
  );
}

function SceneContents({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  return (
    <>
      <Rig />
      <MaterialClock />

      {/* Barely any ambient, and warm rather than cold: a blue-grey fill at
          any real strength turns the champagne architecture to neutral grey,
          which is exactly what the identity is not. */}
      <ambientLight intensity={0.1} color={worldColor(PALETTE.champagneDeep)} />

      {/* The champagne source ahead — what rims the Operator and motivates
          the horizon the journey is walking toward. */}
      <TravellingKey />

      <DistantLight />
      <Corridor />
      <Stations tier={tier} />
      <Operator quality={tier} />
    </>
  );
}

/**
 * The light at the end of the corridor.
 *
 * The champagne horizon is the destination of the whole journey, but 300
 * metres of exponential fog would swallow it from the opening frame. So the
 * source travels ahead of the camera — always present, never reached — and
 * fades out over the last chapter as the real horizon plane takes over. It is
 * why the space reads as leading somewhere from the very first second.
 */
function DistantLight() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createGlowMaterial(PALETTE.champagne, 0.85), []);
  const position = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const node = mesh.current;
    if (!node) return;

    cameraPosition(journey.smooth, position);
    node.position.set(position.x * 0.25, 2.8, position.z - 74);

    // Hand over to the destination horizon rather than overlapping it.
    const handover = clamp01((journey.smooth - 0.82) / 0.14);
    const strength = 0.85 * (1 - handover);
    const shader = node.material as THREE.ShaderMaterial;
    shader.uniforms.uStrength!.value = strength;
    node.visible = strength > 0.02;
  });

  return (
    <mesh ref={mesh} material={material}>
      <planeGeometry args={[52, 18]} />
    </mesh>
  );
}

/**
 * Drives the camera from the journey value and requests a frame only while
 * something is actually moving.
 */
function Rig() {
  const { camera, invalidate, size } = useThree();
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lastProgress = useRef(-1);

  /**
   * A 40° lens frames the corridor on a wide screen and crops it to a slot on
   * a phone, with the Operator filling half the frame. Widening the vertical
   * field as the viewport narrows keeps roughly the same amount of
   * architecture in shot at every aspect — the composition is designed once
   * and holds, rather than being designed for a laptop and cropped elsewhere.
   */
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = Math.min(62, Math.max(40, 40 * Math.sqrt(1.6 / Math.max(0.3, aspect))));
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - fov) > 0.5) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, invalidate, size.width, size.height]);

  // Any journey movement, or any live animation, asks for the next frame.
  useEffect(() => {
    let frame = 0;
    const pump = () => {
      if (journey.visible) invalidate();
      frame = requestAnimationFrame(pump);
    };
    frame = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);

  useFrame(() => {
    const progress = journey.smooth;
    cameraPosition(progress, position);
    lookTarget(progress, target);

    camera.position.copy(position);
    camera.lookAt(target);
    lastProgress.current = progress;
  });

  return null;
}

/** One point light travelling ahead of the camera. */
function TravellingKey() {
  const light = useRef<THREE.PointLight>(null);
  const position = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const node = light.current;
    if (!node) return;
    cameraPosition(journey.smooth, position);
    node.position.set(position.x * 0.4, 3.4, position.z - 22);
  });

  return (
    <>
      <pointLight
        ref={light}
        color={worldColor(PALETTE.champagne)}
        intensity={150}
        distance={100}
        decay={1.5}
      />
      {/* A cold fill from behind so the Operator is never a flat cut-out. */}
      <directionalLight
        color={worldColor(PALETTE.cold)}
        intensity={0.22}
        position={[6, 12, 20]}
      />
    </>
  );
}
