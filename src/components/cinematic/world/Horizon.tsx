"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { linearColor, PALETTE } from "./materials";

/**
 * The champagne horizon the whole identity is built around, and the place the
 * journey is walking toward from its first frame. A single plane with a hand
 * written gradient — no environment map, no HDRI download, no bloom pass.
 */
export function Horizon({
  position = [0, 0, 0],
  width = 260,
  height = 90,
  /** 0→1 height of the light band within the plane. */
  band = 0.34,
  strength = 1,
}: {
  readonly position?: readonly [number, number, number];
  readonly width?: number;
  readonly height?: number;
  readonly band?: number;
  readonly strength?: number;
}) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uBand: { value: band },
        uStrength: { value: strength },
        uWarm: { value: linearColor(PALETTE.champagneLight) },
        uCore: { value: linearColor(PALETTE.champagne) },
        uDeep: { value: linearColor(PALETTE.champagneDeep) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uBand;
        uniform float uStrength;
        uniform vec3 uWarm;
        uniform vec3 uCore;
        uniform vec3 uDeep;
        varying vec2 vUv;

        void main() {
          float d = vUv.y - uBand;

          // Sky above the line, ground below — the ground stays darker.
          float above = exp(-abs(d) * 26.0);
          float halo  = exp(-abs(d) * 5.2) * (d > 0.0 ? 1.0 : 0.45);
          float wide  = exp(-abs(d) * 1.5) * 0.28;

          // The light gathers toward the centre of the opening.
          float lateral = exp(-pow((vUv.x - 0.5) * 2.35, 2.0));

          vec3 col = uDeep * wide;
          col += uCore * halo * 0.75;
          col += uWarm * above * 1.15;
          col *= lateral * uStrength;

          // A hard, thin line where the light meets the ground.
          float line = exp(-abs(d) * 420.0);
          col += uWarm * line * 1.5 * lateral;

          float alpha = clamp(max(max(above, halo * 0.8), wide) * lateral, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
  }, [band, strength]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} position={position as unknown as THREE.Vector3Tuple}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}
