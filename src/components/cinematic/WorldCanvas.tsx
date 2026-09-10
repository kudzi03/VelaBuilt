"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "@/lib/journey";
import type { Tier } from "@/lib/capability";
import { Corridor } from "./world/Corridor";
import { Operator } from "./world/Operator";
import { Stations } from "./world/Stations";
import { MaterialClock } from "./world/primitives";
import { cameraPosition, lookTarget } from "./world/path";
import { FOG_DENSITY, linearColor, PALETTE } from "./world/materials";

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
        gl.toneMappingExposure = 1.05;
        scene.fog = new THREE.FogExp2(linearColor(PALETTE.void).getHex(), FOG_DENSITY);
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

      {/* Barely any ambient: the architecture supplies its own light. */}
      <ambientLight intensity={0.09} color={linearColor(PALETTE.cold)} />

      {/* The champagne source ahead — what rims the Operator and motivates
          the horizon the journey is walking toward. */}
      <TravellingKey />

      <Corridor />
      <Stations tier={tier} />
      <Operator quality={tier} />
    </>
  );
}

/**
 * Drives the camera from the journey value and requests a frame only while
 * something is actually moving.
 */
function Rig() {
  const { camera, invalidate } = useThree();
  const position = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lastProgress = useRef(-1);

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
        color={linearColor(PALETTE.champagne)}
        intensity={26}
        distance={54}
        decay={1.7}
      />
      {/* A cold fill from behind so the Operator is never a flat cut-out. */}
      <directionalLight
        color={linearColor(PALETTE.cold)}
        intensity={0.16}
        position={[6, 12, 20]}
      />
    </>
  );
}
