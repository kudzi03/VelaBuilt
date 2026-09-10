"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  createGlowMaterial,
  createPanelMaterial,
  createSeamMaterial,
  createStoneMaterial,
  PALETTE,
  type PanelOptions,
} from "./materials";

/**
 * Shared building blocks for the corridor.
 *
 * Two rules hold throughout:
 *   · Every material and geometry created here is disposed on unmount. A
 *     cinematic route that leaks GPU memory is a broken cinematic route.
 *   · Time-based uniforms are driven by one clock, not by a useFrame per
 *     object — a hundred panels animate at the cost of one loop.
 */

type TimedMaterial = THREE.ShaderMaterial;
const timedMaterials = new Set<TimedMaterial>();

/** Single loop advancing every time-based uniform in the scene. */
export function MaterialClock() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const material of timedMaterials) {
      const uniform = material.uniforms.uTime;
      if (uniform) uniform.value = t;
    }
  });
  return null;
}

/** Creates a material once, registers its clock, and disposes it on unmount. */
function useMaterial<T extends THREE.Material>(factory: () => T, timed = false): T {
  const material = useMemo(() => factory(), [factory]);

  useEffect(() => {
    if (timed && material instanceof THREE.ShaderMaterial) {
      timedMaterials.add(material);
    }
    return () => {
      if (material instanceof THREE.ShaderMaterial) timedMaterials.delete(material);
      material.dispose();
    };
  }, [material, timed]);

  return material;
}

/* -------------------------------------------------------------------------- */

/** A thin illuminated seam, with the light it throws. */
export function Seam({
  position,
  size,
  color = PALETTE.champagneLight,
  glow = 1,
  opacity = 0.92,
  rotation,
}: {
  readonly position: readonly [number, number, number];
  /** Length, height, depth in metres. */
  readonly size: readonly [number, number, number];
  readonly color?: string;
  readonly glow?: number;
  readonly opacity?: number;
  readonly rotation?: readonly [number, number, number];
}) {
  const material = useMaterial(() => createSeamMaterial(color, opacity));
  const glowMaterial = useMaterial(() => createGlowMaterial(color, 0.42 * glow));

  const [w, h, d] = size;
  const glowScale: [number, number] = [
    Math.max(w * 1.25, 1.4),
    Math.max(h * 9, 1.4),
  ];

  return (
    <group
      position={position as unknown as THREE.Vector3Tuple}
      rotation={rotation as unknown as THREE.EulerTuple}
    >
      <mesh material={material}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {glow > 0 ? (
        <mesh material={glowMaterial} position={[0, 0, d * 0.6 + 0.01]}>
          <planeGeometry args={glowScale} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Additive light bloom, used where a real light source would flare. */
export function Glow({
  position,
  scale,
  color = PALETTE.champagne,
  strength = 0.5,
  rotation,
}: {
  readonly position: readonly [number, number, number];
  readonly scale: readonly [number, number];
  readonly color?: string;
  readonly strength?: number;
  readonly rotation?: readonly [number, number, number];
}) {
  const material = useMaterial(() => createGlowMaterial(color, strength));
  return (
    <mesh
      material={material}
      position={position as unknown as THREE.Vector3Tuple}
      rotation={rotation as unknown as THREE.EulerTuple}
    >
      <planeGeometry args={[scale[0], scale[1]]} />
    </mesh>
  );
}

/** A black-glass interface surface. */
export function InterfacePanel({
  position,
  rotation,
  size,
  options,
}: {
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly size: readonly [number, number];
  readonly options?: PanelOptions;
}) {
  const activity = options?.activity ?? 0.35;
  const accent = options?.accent ?? PALETTE.champagne;
  const opacity = options?.opacity ?? 0.94;
  const seed = options?.seed ?? 0;
  const rows = options?.rows ?? 9;

  const material = useMaterial(
    () => createPanelMaterial({ activity, accent, opacity, seed, rows }),
    true,
  );

  return (
    <mesh
      material={material}
      position={position as unknown as THREE.Vector3Tuple}
      rotation={rotation as unknown as THREE.EulerTuple}
    >
      <planeGeometry args={[size[0], size[1]]} />
    </mesh>
  );
}

/** Architectural stone: walls, slabs, plinths, monoliths. */
export function Stone({
  position,
  rotation,
  size,
  roughness = 0.62,
  children,
}: {
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly size: readonly [number, number, number];
  readonly roughness?: number;
  readonly children?: ReactNode;
}) {
  const material = useMaterial(() => createStoneMaterial(roughness));
  return (
    <mesh
      material={material}
      position={position as unknown as THREE.Vector3Tuple}
      rotation={rotation as unknown as THREE.EulerTuple}
      castShadow={false}
      receiveShadow={false}
    >
      <boxGeometry args={[size[0], size[1], size[2]]} />
      {children}
    </mesh>
  );
}

/**
 * A thin line of light between two points — how one system is shown handing
 * off to another. Drawn as a stretched box so it keeps width at any distance.
 */
export function Link({
  from,
  to,
  color = PALETTE.champagne,
  thickness = 0.012,
  opacity = 0.5,
}: {
  readonly from: readonly [number, number, number];
  readonly to: readonly [number, number, number];
  readonly color?: string;
  readonly thickness?: number;
  readonly opacity?: number;
}) {
  const material = useMaterial(() => createSeamMaterial(color, opacity));

  const { position, rotation, length } = useMemo(() => {
    const a = new THREE.Vector3(...(from as [number, number, number]));
    const b = new THREE.Vector3(...(to as [number, number, number]));
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const direction = b.clone().sub(a);
    const len = direction.length();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      direction.clone().normalize(),
    );
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length: len,
    };
  }, [from, to]);

  return (
    <mesh material={material} position={position} rotation={rotation}>
      <boxGeometry args={[length, thickness, thickness]} />
    </mesh>
  );
}
