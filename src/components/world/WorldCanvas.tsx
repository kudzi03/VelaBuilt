"use client";

/* eslint-disable react-hooks/immutability -- see the note below. */

/**
 * THE RENDERER.
 *
 * Deliberately thin. Every hard part — walking, collision, input, geometry,
 * materials — lives in plain modules under src/world, and this file is the
 * fifty lines that hand them a canvas and a clock.
 *
 * That split is not tidiness. It means the movement can be reasoned about and
 * tested without a renderer, the voice guide can describe a hall without
 * importing three.js, and none of the per-frame work ever touches React.
 *
 * ── ON THE DISABLED RULE ─────────────────────────────────────────────────
 *
 * react-hooks/immutability is off for this file, deliberately and only here.
 *
 * The rule guards React's own data flow: a value React hands you must not be
 * mutated, because React assumes it did not change and will not re-render.
 * That is exactly right for application state, and exactly wrong for a
 * three.js rig, which is a mutable scene graph by design — a camera that
 * cannot be moved is not a camera.
 *
 * The rig is held by a lazy state initialiser so it survives re-renders and
 * can be mounted with <primitive>, and it is then driven imperatively at
 * sixty hertz. React must never re-render because the player walked; that is
 * the whole architecture, not an oversight. Nothing React actually owns is
 * mutated anywhere in this file: no scene.environment, no scene.add, no
 * setState from the frame loop.
 */

import { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { SPAWN, hallAt } from "@/world/facility";
import { Player } from "@/world/player";
import { Input, type TouchStick } from "@/world/input";
import { buildEnvironment, buildSurfaces } from "@/world/materials";
import { buildWorld, type World } from "@/world/scene";
import type { Surfaces } from "@/world/materials";
import { setHall, worldContext } from "@/world/state";
import type { WorldAudio } from "@/world/audio";
import type { Capability } from "@/lib/capability";

export interface WorldHandle {
  /** Put the visitor in front of a hall. Used by the guide and the map. */
  goTo(x: number, z: number, yaw?: number): void;
  requestLook(): void;
}

interface Props {
  capability: Capability;
  /**
   * The ambience, by reference rather than by value. It is created on the
   * visitor's gesture — which may land before or after this canvas mounts —
   * so the frame loop reads the ref each frame instead of the component
   * reading it during render.
   */
  audioRef: React.RefObject<WorldAudio | null>;
  onReady: () => void;
  onLockChange: (locked: boolean) => void;
  onStick: (s: TouchStick) => void;
  handleRef: React.MutableRefObject<WorldHandle | null>;
}

export function WorldCanvas({ capability, audioRef, onReady, onLockChange, onStick, handleRef }: Props) {
  const quality = capability.tier === "A" ? "high" : "low";
  return (
    <Canvas
      // No alpha: the world fills the viewport and a transparent buffer costs
      // a blend on every pixel for a background nobody ever sees.
      gl={{
        antialias: quality === "high",
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      dpr={capability.dpr as [number, number]}
      shadows={quality === "high"}
      camera={{ fov: 62, near: 0.12, far: 140, position: [...SPAWN.position] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        // Measured against the rendered frame rather than guessed: at 1.04
        // the halls read as a cave. ACES rolls the highlights off, so the
        // coves stay creamy rather than clipping to white at this exposure.
        gl.toneMappingExposure = 1.32;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // Fog does two jobs: it gives the long axis of the building real
        // depth, and it hides the far wall of a hall you have not reached
        // yet, so the place always feels like it continues.
        scene.fog = new THREE.FogExp2(0x06060b, 0.017);
        scene.background = new THREE.Color(0x05050a);
      }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <Stage
        quality={quality}
        capability={capability}
        audioRef={audioRef}
        onReady={onReady}
        onLockChange={onLockChange}
        onStick={onStick}
        handleRef={handleRef}
      />
    </Canvas>
  );
}

function Stage({
  quality,
  capability,
  audioRef,
  onReady,
  onLockChange,
  onStick,
  handleRef,
}: {
  quality: "high" | "low";
  capability: Capability;
  audioRef: React.RefObject<WorldAudio | null>;
  onReady: () => void;
  onLockChange: (locked: boolean) => void;
  onStick: (s: TouchStick) => void;
  handleRef: React.MutableRefObject<WorldHandle | null>;
}) {
  const { gl, camera } = useThree();

  /**
   * Built once, by a lazy state initialiser.
   *
   * This is what lets the whole scene graph live outside React. The group is
   * mounted with <primitive> rather than scene.add(), so nothing in this file
   * ever mutates a value React owns — no scene.environment, no scene.add, no
   * per-frame reach into three.js from a hook.
   *
   * The two obvious alternatives are both worse. Building in an effect and
   * holding the result in state costs a second render of the entire canvas
   * and a frame of empty scene. Building into a ref means reading that ref
   * during render to mount it, which is exactly the hazard the rule against
   * it exists to catch.
   */
  const [rig] = useState<Rig>(() => {
    const env = buildEnvironment(gl as THREE.WebGLRenderer);
    const surfaces = buildSurfaces(env);
    const world = buildWorld(surfaces, quality);
    const player = new Player(SPAWN.position, SPAWN.yaw);
    player.gait = !capability.reducedMotion;
    return { env, surfaces, world, player, input: null };
  });

  useEffect(() => {
    rig.input = new Input(gl.domElement, { onLockChange, onStick });
    handleRef.current = {
      goTo(x, z, yaw) {
        rig.player.teleport(x, z, yaw);
      },
      requestLook() {
        rig.input?.request();
      },
    };
    onReady();

    return () => {
      rig.input?.dispose();
      rig.world.dispose();
      rig.surfaces.dispose();
      rig.env.dispose();
      handleRef.current = null;
    };
    // Built once; quality and capability cannot change without a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, dt) => {
    if (!rig.input) return;

    rig.player.step(dt, rig.input.read());
    const s = rig.player.state;

    camera.position.set(s.x, s.y, s.z);
    // Yaw then pitch as Euler YXZ, so looking up can never roll the horizon —
    // the single most common cause of first-person nausea on the web.
    camera.rotation.set(s.pitch, s.yaw, 0, "YXZ");

    worldContext.speed = s.speed01;
    worldContext.distance = s.distance;

    const hall = hallAt(s.x, s.z);
    setHall(hall?.id ?? null);
    rig.world.focusHall(hall);

    const sound = audioRef.current;
    if (sound) {
      sound.setTone(hall?.tone ?? null);
      // Footsteps are keyed to metres walked, not to the clock, so they
      // slow as the visitor slows and stop dead when they do.
      sound.step(s.distance);
    }
    rig.world.tick(performance.now() / 1000, !capability.reducedMotion);
  });

  return <primitive object={rig.world.root} />;
}

interface Rig {
  readonly env: THREE.Texture;
  readonly surfaces: Surfaces;
  readonly world: World;
  readonly player: Player;
  input: Input | null;
}
