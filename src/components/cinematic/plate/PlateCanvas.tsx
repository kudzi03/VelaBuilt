"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS, clamp01, damp, journey } from "@/lib/journey";
import type { Tier } from "@/lib/capability";
import { SCENES, type Scene } from "@/content/scenes";
import { labRoom } from "@/components/lab/labRoom";
import { PLATE_FRAGMENT, PLATE_VERTEX } from "./plateShader";
import {
  isPlateReady,
  requestPlate,
  setPlateCanvasWidth,
  sweepPlates,
  disposePlates,
  plateSize,
} from "./plateTextures";

/**
 * THE CINEMATIC LAYER.
 *
 * A single full-screen quad running the plate compositor. There is no scene
 * geometry: the environment is photographic, and the camera lives in the
 * shader. That is the whole point of the rebuild — the frame budget goes into
 * grading, bloom and atmosphere on real architecture instead of into drawing a
 * worse approximation of it.
 *
 * Loaded only on capable devices, only after the page is interactive, and
 * always behind semantic HTML that already said everything the scene shows.
 */

export function PlateCanvas({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const dpr: [number, number] = tier === "A" ? [1, 2] : [1, 1.5];

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      frameloop="demand"
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
      // The compositor draws in clip space; the camera is a formality.
      orthographic
      camera={{ position: [0, 0, 1] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x050506, 1);
      }}
    >
      <Compositor tier={tier} />
    </Canvas>
  );
}

/** Blends two scenes' camera and grade parameters into the shader uniforms. */
function Compositor({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const { size, invalidate, gl } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const fallbackTexture = useMemo(() => {
    // A 1×1 near-black texture so the shader always has something bound, even
    // before the first plate has decoded.
    const data = new Uint8Array([5, 5, 6, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  const uniforms = useMemo(
    () => ({
      uPlateA: { value: fallbackTexture },
      uPlateB: { value: fallbackTexture },
      uMix: { value: 0 },
      uSamePlate: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPlateSize: { value: new THREE.Vector2(1672, 941) },

      uFocalA: { value: new THREE.Vector2(0.5, 0.5) },
      uFocalB: { value: new THREE.Vector2(0.5, 0.5) },
      uZoomA: { value: 1 },
      uZoomB: { value: 1 },
      uPanA: { value: new THREE.Vector2() },
      uPanB: { value: new THREE.Vector2() },

      uHorizonA: { value: 0.63 },
      uHorizonB: { value: 0.63 },
      uLateralA: { value: 0.9 },
      uLateralB: { value: 0.9 },
      uParallax: { value: tier === "A" ? 0.95 : 0.7 },

      uExposureA: { value: 0 },
      uExposureB: { value: 0 },
      uContrastA: { value: 1.06 },
      uContrastB: { value: 1.06 },
      uSaturationA: { value: 1.04 },
      uSaturationB: { value: 1.04 },
      uWarmthA: { value: 0.16 },
      uWarmthB: { value: 0.16 },
      uBloomA: { value: 0.5 },
      uBloomB: { value: 0.5 },
      uHazeA: { value: 0.3 },
      uHazeB: { value: 0.3 },

      uVignette: { value: 0.42 },
      uGrain: { value: 0.015 },
      uTime: { value: 0 },
      uQuality: { value: tier === "A" ? 1 : 0 },

      uDim: { value: 0 },
      uSpot: { value: new THREE.Vector3(0.5, 0.5, 0.4) },
    }),
    [fallbackTexture, tier],
  );

  useEffect(() => {
    return () => {
      fallbackTexture.dispose();
      disposePlates();
    };
  }, [fallbackTexture]);

  useEffect(() => {
    setPlateCanvasWidth(size.width);
    uniforms.uResolution.value.set(size.width, size.height);
    invalidate();
  }, [size.width, size.height, uniforms, invalidate]);

  // Keep requesting frames while the journey is on screen. The compositor is
  // cheap enough that gating on movement would cost more in stutter than it
  // saves, but it still stops entirely once the section leaves the viewport.
  useEffect(() => {
    let frame = 0;
    const pump = () => {
      if (journey.visible) invalidate();
      frame = requestAnimationFrame(pump);
    };
    frame = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);

  const sweepTick = useRef(0);
  const dim = useRef(0);
  const spot = useRef(new THREE.Vector3(0.5, 0.5, 0.4));

  useFrame((state, rawDelta) => {
    const shader = material.current;
    if (!shader) return;
    const delta = Math.min(0.05, rawDelta);

    // Where we are between two chapters.
    const station = clamp01(journey.smooth) * (CHAPTERS.length - 1);
    const index = Math.min(CHAPTERS.length - 2, Math.floor(station));
    const t = CHAPTERS.length > 1 ? station - index : 0;

    const from = SCENES[index]!;
    const to = SCENES[index + 1] ?? from;

    // Ask for what is on screen now, plus the room we are walking into.
    const textureA = requestPlate(from.plate);
    const textureB = requestPlate(to.plate);

    const u = shader.uniforms;
    u.uPlateA!.value = textureA ?? u.uPlateA!.value;
    u.uPlateB!.value = textureB ?? textureA ?? u.uPlateB!.value;

    // Hold on the outgoing room until the next one has actually decoded,
    // otherwise a slow network shows a dissolve into flat black.
    const ready = isPlateReady(to.plate);
    const samePlate = from.plate === to.plate;
    u.uMix!.value = ready || samePlate ? t : 0;
    u.uSamePlate!.value = samePlate ? 1 : 0;

    const [pw, ph] = plateSize(from.plate);
    u.uPlateSize!.value.set(pw, ph);

    // The compositor is cropped to the portrait band on tall screens, so it
    // reframes to the same part of the room the CSS plate would.
    // Measured on the canvas, not the viewport: in portrait the canvas is
    // the band, which is taller than it is wide but nowhere near as tall as
    // the phone. Any canvas taller than it is wide reframes.
    const portrait = state.size.width / Math.max(1, state.size.height) < 1;

    applyScene(u, from, "A", t, false, portrait);
    applyScene(u, to, "B", t, true, portrait);

    u.uTime!.value = state.clock.elapsedTime;

    // The lab room reacts: dim everything but the selected chain.
    const target = labRoom.active ? labRoom.dim : 0;
    dim.current = damp(dim.current, target, 0.002, delta);
    u.uDim!.value = dim.current;

    spot.current.x = damp(spot.current.x, labRoom.spot[0], 0.004, delta);
    spot.current.y = damp(spot.current.y, labRoom.spot[1], 0.004, delta);
    spot.current.z = damp(spot.current.z, labRoom.spot[2], 0.004, delta);
    u.uSpot!.value.copy(spot.current);

    // Release plates we have walked away from, a few times a second.
    sweepTick.current += 1;
    if (sweepTick.current % 30 === 0) {
      sweepPlates([from.plate, to.plate]);
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={PLATE_VERTEX}
        fragmentShader={PLATE_FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        key={gl.getContextAttributes()?.alpha === false ? "opaque" : "alpha"}
      />
    </mesh>
  );
}

type Uniforms = Record<string, THREE.IUniform>;

/**
 * Writes one scene's camera and grade into the A or B uniform slot.
 *
 * `t` is progress between the two chapters. The outgoing scene keeps
 * travelling while the incoming one is still arriving, so the two cameras are
 * always moving together and the handover never looks like a cut.
 */
function applyScene(
  u: Uniforms,
  scene: Scene,
  slot: "A" | "B",
  t: number,
  incoming: boolean,
  portrait: boolean,
): void {
  // The outgoing room finishes its move; the incoming one is only just
  // starting, so it plays the first part of its own push.
  const local = incoming ? t * 0.55 : 0.45 + t * 0.55;
  const eased = local * local * (3 - 2 * local);

  const zoom = scene.zoom[0] + (scene.zoom[1] - scene.zoom[0]) * eased;
  const pan = scene.pan[0] + (scene.pan[1] - scene.pan[0]) * eased;

  const focal = portrait ? scene.portraitFocal : scene.focal;
  (u[`uFocal${slot}`]!.value as THREE.Vector2).set(focal[0], focal[1]);
  u[`uZoom${slot}`]!.value = zoom;
  (u[`uPan${slot}`]!.value as THREE.Vector2).set(pan, pan * -0.35);

  u[`uHorizon${slot}`]!.value = scene.horizon;
  u[`uLateral${slot}`]!.value = scene.lateral;

  const g = scene.grade;
  u[`uExposure${slot}`]!.value = g.exposure;
  u[`uContrast${slot}`]!.value = g.contrast;
  u[`uSaturation${slot}`]!.value = g.saturation;
  u[`uWarmth${slot}`]!.value = g.warmth;
  // The practicals breathe very slightly, so a held frame is never dead.
  u[`uBloom${slot}`]!.value = g.bloom;
  u[`uHaze${slot}`]!.value = g.haze;
}
