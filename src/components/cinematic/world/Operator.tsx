"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey, clamp01, damp } from "@/lib/journey";
import { worldColor } from "./materials";
import { JOURNEY_LENGTH, operatorPosition } from "./path";

/**
 * THE OPERATOR — the silent protagonist.
 *
 * He is never a mascot and never addresses the visitor. He walks the corridor
 * ahead of the camera, in near-silhouette against the champagne light, and his
 * relationship to the machinery is the whole argument of the page: at the
 * start he is working the systems by hand; by the end they run behind him and
 * he simply walks toward the horizon.
 *
 * Motion is motivated by the visitor, not by a timer: the walk cycle is driven
 * by how fast the journey is actually moving, so when the visitor stops
 * scrolling, he stops walking. Nothing loops in place.
 *
 * ---------------------------------------------------------------------------
 * REPLACING THIS WITH A PRODUCTION CHARACTER
 * ---------------------------------------------------------------------------
 * This is a deliberately temporary, licence-free procedural rig — no purchased
 * or scraped assets. It is isolated behind one component and one contract so a
 * final character swaps in without touching the world, the camera or the page.
 *
 * To swap: replace the <group> contents with a loaded skinned mesh and drive
 * its AnimationMixer from the same three values already computed below —
 * `walkPhase` (0→2π), `speed` (0→1) and `attention` (0→1). The rest of the
 * scene needs no change.
 *
 * Asset requirements are documented in CREATIVE_SYSTEM.md under
 * "Character asset specification".
 */

const SKIN = {
  coat: "#08080b",
  body: "#050507",
  skin: "#141216",
} as const;

/** Metres per stride, used to convert travel into a walk cycle. */
const STRIDE = 0.82;
/** Metres the journey covers end to end, taken from the path itself. */
const JOURNEY_METRES = JOURNEY_LENGTH;

export function Operator({ quality }: { readonly quality: "A" | "B" }) {
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const coat = useRef<THREE.Group>(null);

  const phase = useRef(0);
  const speed = useRef(0);
  const attention = useRef(0);
  const position = useMemo(() => new THREE.Vector3(), []);

  const materials = useMemo(
    () => ({
      coat: new THREE.MeshStandardMaterial({
        color: worldColor(SKIN.coat),
        roughness: 0.74,
        metalness: 0.12,
      }),
      body: new THREE.MeshStandardMaterial({
        color: worldColor(SKIN.body),
        roughness: 0.62,
        metalness: 0.2,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: worldColor(SKIN.skin),
        roughness: 0.55,
        metalness: 0.05,
      }),
    }),
    [],
  );

  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose();
    },
    [materials],
  );

  useFrame((_, rawDelta) => {
    if (!journey.visible) return;
    const delta = Math.min(0.05, rawDelta);
    const progress = journey.smooth;

    // --- Placement -------------------------------------------------------
    operatorPosition(progress, position);
    root.current?.position.copy(position);

    // --- Walk, driven by actual travel ------------------------------------
    const metresPerSecond = Math.abs(journey.velocity) * JOURNEY_METRES;
    const target = clamp01(metresPerSecond / 1.5);
    speed.current = damp(speed.current, target, 0.002, delta);
    phase.current += (metresPerSecond / STRIDE) * Math.PI * delta;

    const swing = Math.sin(phase.current) * 0.42 * speed.current;
    const counter = Math.sin(phase.current + Math.PI) * 0.42 * speed.current;
    const bob = Math.abs(Math.sin(phase.current)) * 0.035 * speed.current;

    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = counter;
    if (armL.current) armL.current.rotation.x = counter * 0.55;
    if (armR.current) armR.current.rotation.x = swing * 0.55;
    if (hips.current) hips.current.position.y = 0.92 + bob;
    if (chest.current) chest.current.rotation.y = Math.sin(phase.current) * 0.05 * speed.current;

    // The coat carries the momentum a beat behind the body.
    if (coat.current) {
      coat.current.rotation.x = damp(
        coat.current.rotation.x,
        -speed.current * 0.09,
        0.004,
        delta,
      );
    }

    // --- Attention -------------------------------------------------------
    // He looks up at the architecture in the middle chapters, and levels off
    // toward the horizon at the end.
    const lookUp =
      Math.exp(-Math.pow((progress - 0.2) / 0.09, 2)) * 0.9 +
      Math.exp(-Math.pow((progress - 0.8) / 0.09, 2)) * 0.7;
    attention.current = damp(attention.current, clamp01(lookUp), 0.003, delta);

    if (head.current) {
      head.current.rotation.x = -attention.current * 0.34;
      head.current.rotation.y = Math.sin(progress * Math.PI * 2.1) * 0.12;
    }

    // He faces the way he is travelling, turning slightly into his drift.
    if (root.current) {
      const turn = Math.cos(progress * Math.PI * 3.1 + 0.6) * 0.12;
      root.current.rotation.y = Math.PI + turn;
    }
  });

  const segments = quality === "A" ? 12 : 6;

  return (
    <group ref={root} position={[0, 0, -12]}>
      <group ref={hips} position={[0, 0.92, 0]}>
        {/* Legs — pivoting at the hip. */}
        <group ref={legL} position={[-0.11, 0, 0]}>
          <mesh material={materials.body} position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.072, 0.72, 3, segments]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.11, 0, 0]}>
          <mesh material={materials.body} position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.072, 0.72, 3, segments]} />
          </mesh>
        </group>

        <group ref={chest}>
          {/* Torso. */}
          <mesh material={materials.body} position={[0, 0.3, 0]}>
            <capsuleGeometry args={[0.155, 0.3, 3, segments]} />
          </mesh>

          {/* The long coat — the silhouette that makes him read as a person
              of some standing rather than a figure in a game. */}
          <group ref={coat} position={[0, 0.42, 0]}>
            <mesh material={materials.coat} position={[0, -0.38, 0]}>
              <cylinderGeometry args={[0.215, 0.325, 0.82, segments * 2, 1, true]} />
            </mesh>
            <mesh material={materials.coat} position={[0, 0.04, 0]}>
              <capsuleGeometry args={[0.2, 0.16, 3, segments]} />
            </mesh>
          </group>

          {/* Arms. */}
          <group ref={armL} position={[-0.215, 0.44, 0]}>
            <mesh material={materials.coat} position={[0, -0.29, 0]}>
              <capsuleGeometry args={[0.052, 0.5, 3, segments]} />
            </mesh>
          </group>
          <group ref={armR} position={[0.215, 0.44, 0]}>
            <mesh material={materials.coat} position={[0, -0.29, 0]}>
              <capsuleGeometry args={[0.052, 0.5, 3, segments]} />
            </mesh>
          </group>

          {/* Neck and head. */}
          <mesh material={materials.body} position={[0, 0.55, 0]}>
            <capsuleGeometry args={[0.043, 0.06, 3, segments]} />
          </mesh>
          <group ref={head} position={[0, 0.68, 0]}>
            <mesh material={materials.skin}>
              <capsuleGeometry args={[0.093, 0.075, 3, segments]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
