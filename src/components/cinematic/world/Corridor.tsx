"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CHAPTERS } from "@/lib/journey";
import { createFloorMaterial, createSeamMaterial, PALETTE } from "./materials";
import { Glow, Seam, Stone } from "./primitives";

/**
 * ONE CONTINUOUS SPACE.
 *
 * Every chapter of the homepage happens inside this corridor — the camera
 * never cuts, it travels. Thresholds sit between stations so each chapter
 * change is motivated by architecture the visitor physically passes through
 * rather than by a transition effect laid over the top.
 *
 * Cost discipline: the floor's rhythm lives in its shader, the ribs are one
 * instanced draw call, and the walls are two boxes. The corridor is roughly a
 * dozen draw calls end to end, which leaves the budget for the stations.
 */

export const CORRIDOR = {
  halfWidth: 11,
  height: 15,
  /** Total run, with headroom either end of the journey. */
  start: 24,
  end: CHAPTERS[CHAPTERS.length - 1]!.z - 60,
} as const;

const LENGTH = CORRIDOR.start - CORRIDOR.end;
const MID_Z = (CORRIDOR.start + CORRIDOR.end) / 2;

export function Corridor() {
  const floorMaterial = useMemo(
    () => createFloorMaterial(CORRIDOR.halfWidth),
    [],
  );

  useEffect(() => () => floorMaterial.dispose(), [floorMaterial]);

  return (
    <group>
      {/* Floor — lit black stone, its reflections written into the shader. */}
      <mesh
        material={floorMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, MID_Z]}
      >
        <planeGeometry args={[CORRIDOR.halfWidth * 3.4, LENGTH]} />
      </mesh>

      {/* Walls. */}
      <Stone
        position={[-CORRIDOR.halfWidth - 0.6, CORRIDOR.height / 2, MID_Z]}
        size={[1.2, CORRIDOR.height, LENGTH]}
        roughness={0.72}
      />
      <Stone
        position={[CORRIDOR.halfWidth + 0.6, CORRIDOR.height / 2, MID_Z]}
        size={[1.2, CORRIDOR.height, LENGTH]}
        roughness={0.72}
      />

      {/* Ceiling, kept low enough to feel monumental rather than open. */}
      <Stone
        position={[0, CORRIDOR.height + 0.4, MID_Z]}
        size={[CORRIDOR.halfWidth * 2.6, 0.8, LENGTH]}
        roughness={0.8}
      />

      {/* Continuous wall seams — the identity's thin illuminated line.
          The line itself is 6cm of geometry, which is sub-pixel by twenty
          metres out, so each one is paired with an additive strip that carries
          its light into the distance. Without the pair the corridor loses all
          its champagne the moment the camera pulls back. */}
      {([-1, 1] as const).map((side) =>
        [2.45, 8.6].map((y) => (
          <group key={`wall-${side}-${y}`}>
            <Seam
              position={[side * (CORRIDOR.halfWidth - 0.02), y, MID_Z]}
              size={[0.12, 0.12, LENGTH]}
              opacity={y > 5 ? 0.7 : 1}
              glow={0}
            />
            <Glow
              position={[side * (CORRIDOR.halfWidth - 0.12), y, MID_Z]}
              rotation={[0, side * -Math.PI / 2, 0]}
              scale={[LENGTH, y > 5 ? 2.6 : 3.6]}
              strength={y > 5 ? 0.2 : 0.32}
              falloff="cross"
            />
          </group>
        )),
      )}

      {/* Ceiling strip running the length of the journey. */}
      <Seam
        position={[0, CORRIDOR.height - 0.15, MID_Z]}
        size={[0.55, 0.05, LENGTH]}
        color={PALETTE.champagne}
        opacity={0.5}
        glow={0}
      />
      <Glow
        position={[0, CORRIDOR.height - 0.4, MID_Z]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        scale={[LENGTH, 3.4]}
        strength={0.22}
        falloff="cross"
      />

      <WallRibs />

      {/* Thresholds between chapters. */}
      {CHAPTERS.slice(0, -1).map((chapter, index) => {
        const next = CHAPTERS[index + 1]!;
        return <Threshold key={chapter.id} z={(chapter.z + next.z) / 2} />;
      })}
    </group>
  );
}

/**
 * Vertical light ribs down both walls, in a single instanced draw call.
 * They give the corridor its sense of speed as the camera travels.
 */
function WallRibs() {
  const { mesh } = useMemo(() => {
    const spacing = 12;
    const count = Math.floor(LENGTH / spacing);
    const geometry = new THREE.BoxGeometry(0.05, 5.6, 0.05);
    const material = createSeamMaterial(PALETTE.champagneDeep, 0.55);
    const instanced = new THREE.InstancedMesh(geometry, material, count * 2);
    instanced.frustumCulled = false;

    const matrix = new THREE.Matrix4();
    let i = 0;
    for (let step = 0; step < count; step += 1) {
      const z = CORRIDOR.start - step * spacing;
      for (const side of [-1, 1]) {
        matrix.setPosition(side * (CORRIDOR.halfWidth - 0.03), 5.5, z);
        instanced.setMatrixAt(i, matrix);
        i += 1;
      }
    }
    instanced.instanceMatrix.needsUpdate = true;

    return { mesh: instanced };
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    },
    [mesh],
  );

  return <primitive object={mesh} />;
}

/**
 * A threshold the camera passes through. Chapter changes are motivated by
 * this rather than by a fade: you go somewhere, and the space changes.
 */
function Threshold({ z }: { readonly z: number }) {
  const aperture = 6.6;
  const lintel = 7.6;

  return (
    <group position={[0, 0, z]}>
      {([-1, 1] as const).map((side) => (
        <Stone
          key={side}
          position={[side * (aperture + (CORRIDOR.halfWidth - aperture) / 2), 6, 0]}
          size={[CORRIDOR.halfWidth - aperture, 12, 1.6]}
          roughness={0.66}
        />
      ))}

      <Stone
        position={[0, lintel + 1.6, 0]}
        size={[CORRIDOR.halfWidth * 2, 3.2, 1.6]}
        roughness={0.66}
      />

      {/* Lit inner edges — the light that makes the threshold readable. */}
      {([-1, 1] as const).map((side) => (
        <Seam
          key={`edge-${side}`}
          position={[side * aperture, lintel / 2, 0.82]}
          size={[0.09, lintel, 0.09]}
          opacity={0.95}
          glow={1.5}
        />
      ))}
      <Seam
        position={[0, lintel, 0.82]}
        size={[aperture * 2, 0.09, 0.09]}
        opacity={0.95}
        glow={1.5}
      />

      {/* The threshold's spill on the floor. */}
      <Glow
        position={[0, 0.02, 0.9]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[aperture * 2.4, 9]}
        strength={0.4}
      />
    </group>
  );
}
