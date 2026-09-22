/**
 * WALKING.
 *
 * The single thing that decides whether a visitor believes they are in a
 * place or think they are dragging a camera around a model. Everything here
 * is tuned against that, and nothing here runs through React: the frame loop
 * mutates one object and the interface reads it, so moving never costs a
 * render.
 *
 * ── WHAT MAKES IT FEEL REAL ──────────────────────────────────────────────
 *
 * Mass. The body accelerates to speed over ~180 ms and coasts to a stop over
 * ~140 ms. Instant start/stop is the tell of a cheap FPS; so is a body that
 * slides like ice. These two numbers are most of the feel.
 *
 * Sliding, not stopping. Walking into a wall at an angle carries you along
 * it. Stopping dead on contact is what makes a corridor feel like a maze of
 * invisible boxes.
 *
 * A head, not a spring. There IS a gait — 1.7 cm of vertical travel, phase
 * locked to distance covered rather than to time, so it slows as you slow and
 * stops when you stop. Anything bigger is nausea. Turned off entirely under
 * prefers-reduced-motion.
 *
 * No jumping, no crouching, no sprint. This is a building people walk around
 * in. Every control that exists has a reason to.
 *
 * ── WHY THE COLLISION IS THIS SIMPLE ─────────────────────────────────────
 *
 * The facility is axis-aligned boxes, so resolution is exact and costs a few
 * comparisons per solid — no physics engine, no broadphase, no wasm. Rapier
 * would be ~400 KB to solve a problem that the building's own geometry has
 * already solved. The nearest-surface push-out below handles corners and
 * doorways correctly because a doorway is a genuine gap between two boxes
 * rather than a trigger volume.
 */

import {
  EYE_HEIGHT,
  PLAYER_RADIUS,
  buildSolids,
  floorAt,
  type Solid,
} from "./facility";

/* ── tuning ─────────────────────────────────────────────────────────────── */

/** Metres per second. A walk, not a jog. */
const WALK_SPEED = 2.35;
/** Seconds to reach full speed, and to come back to rest. */
const ACCEL_TIME = 0.18;
const BRAKE_TIME = 0.14;
/** Radians per pixel of mouse movement at default sensitivity. */
const LOOK_SCALE = 0.0022;
/** Hard clamp so the horizon can never invert. */
const PITCH_LIMIT = Math.PI / 2 - 0.08;
/** Vertical gait travel, metres. Deliberately small. */
const BOB_AMPLITUDE = 0.017;
/** Metres per full gait cycle — two steps. */
const STRIDE = 1.55;
/** Seconds for the eye to settle to a new floor height after a ramp. */
const FLOOR_SMOOTH = 0.09;

export interface PlayerInput {
  /** -1..1, left/right strafe. */
  strafe: number;
  /** -1..1, back/forward. */
  forward: number;
  /** Radians to add this frame, already scaled. */
  yawDelta: number;
  pitchDelta: number;
}

export interface PlayerState {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly pitch: number;
  /** 0..1 — how fast the body is actually moving, for audio and gait. */
  readonly speed01: number;
  /** Total metres walked. Drives footsteps. */
  readonly distance: number;
}

export class Player {
  private px: number;
  private pz: number;
  /** Eye height above the floor under us, smoothed across ramps. */
  private eye: number;
  private floor: number;
  private vx = 0;
  private vz = 0;
  private yawA: number;
  private pitchA = 0;
  private dist = 0;
  private bobPhase = 0;
  private readonly solids: readonly Solid[];

  /** Set false under prefers-reduced-motion; kills the gait entirely. */
  gait = true;
  /** 0.4–2.0. Exposed so the interface can offer a sensitivity control. */
  sensitivity = 1;

  constructor(spawn: readonly [number, number, number], yaw: number) {
    this.px = spawn[0];
    this.pz = spawn[2];
    this.floor = floorAt(spawn[0], spawn[2]) ?? 0;
    this.eye = this.floor + EYE_HEIGHT;
    this.yawA = yaw;
    this.solids = buildSolids().filter((s) => s.kind === "wall" || s.kind === "fixture");
  }

  /** Read-only snapshot for the renderer, the HUD and the audio engine. */
  get state(): PlayerState {
    const speed = Math.hypot(this.vx, this.vz);
    return {
      x: this.px,
      y: this.eye + (this.gait ? Math.sin(this.bobPhase) * BOB_AMPLITUDE : 0),
      z: this.pz,
      yaw: this.yawA,
      pitch: this.pitchA,
      speed01: Math.min(speed / WALK_SPEED, 1),
      distance: this.dist,
    };
  }

  /** Put the player somewhere, e.g. when the guide walks them to a hall. */
  teleport(x: number, z: number, yaw?: number): void {
    this.px = x;
    this.pz = z;
    this.vx = 0;
    this.vz = 0;
    this.floor = floorAt(x, z) ?? this.floor;
    this.eye = this.floor + EYE_HEIGHT;
    if (yaw !== undefined) this.yawA = yaw;
  }

  step(dt: number, input: PlayerInput): void {
    // A tab that was backgrounded hands back a multi-second dt; integrating it
    // would fire the player through a wall. Clamp to two frames at 30fps.
    const d = Math.min(dt, 0.066);

    this.yawA -= input.yawDelta * LOOK_SCALE * this.sensitivity;
    this.pitchA = clamp(
      this.pitchA - input.pitchDelta * LOOK_SCALE * this.sensitivity,
      -PITCH_LIMIT,
      PITCH_LIMIT,
    );

    // Desired velocity in world space. Normalised so diagonal is not faster —
    // the oldest bug in first-person movement.
    let wishX = 0;
    let wishZ = 0;
    const mag = Math.hypot(input.strafe, input.forward);
    if (mag > 0.001) {
      const nx = input.strafe / Math.max(mag, 1);
      const nz = input.forward / Math.max(mag, 1);
      const sin = Math.sin(this.yawA);
      const cos = Math.cos(this.yawA);
      // yaw 0 looks down -z.
      wishX = (nx * cos - nz * sin) * WALK_SPEED;
      wishZ = (-nx * sin - nz * cos) * WALK_SPEED;
    }

    const moving = mag > 0.001;
    const tau = moving ? ACCEL_TIME : BRAKE_TIME;
    // Exponential approach, frame-rate independent. Not a lerp with a magic
    // constant: this gives the same feel at 30fps and at 144.
    const k = 1 - Math.exp(-d / tau);
    this.vx += (wishX - this.vx) * k;
    this.vz += (wishZ - this.vz) * k;
    if (Math.abs(this.vx) < 0.004) this.vx = 0;
    if (Math.abs(this.vz) < 0.004) this.vz = 0;

    if (this.vx !== 0 || this.vz !== 0) {
      const before = { x: this.px, z: this.pz };
      this.move(this.vx * d, this.vz * d);
      const travelled = Math.hypot(this.px - before.x, this.pz - before.z);
      this.dist += travelled;
      if (this.gait) this.bobPhase += (travelled / STRIDE) * Math.PI * 2;
    }

    const target = floorAt(this.px, this.pz);
    if (target !== null) this.floor = target;
    const wantEye = this.floor + EYE_HEIGHT;
    this.eye += (wantEye - this.eye) * (1 - Math.exp(-d / FLOOR_SMOOTH));
  }

  /**
   * Move, then push back out of anything entered. Axis-separated so a wall
   * blocks one component and leaves the other free — that is what makes
   * walking along a corridor wall feel like sliding rather than sticking.
   */
  private move(dx: number, dz: number): void {
    this.px += dx;
    this.resolve();
    this.pz += dz;
    this.resolve();

    // Last line of defence. If the solver has somehow left us outside the
    // building, step back rather than letting the visitor walk into the void.
    if (floorAt(this.px, this.pz) === null) {
      this.px -= dx;
      this.pz -= dz;
      this.vx = 0;
      this.vz = 0;
    }
  }

  /**
   * Push the player's cylinder out of every box it overlaps, along whichever
   * axis needs the least correction. Repeated twice so an inside corner —
   * where two pushes fight — settles instead of oscillating.
   */
  private resolve(): void {
    const feet = this.floor + 0.1;
    const head = this.floor + EYE_HEIGHT + 0.12;
    for (let pass = 0; pass < 2; pass++) {
      let hit = false;
      for (const s of this.solids) {
        if (s.max[1] <= feet || s.min[1] >= head) continue;
        const nx = clamp(this.px, s.min[0], s.max[0]);
        const nz = clamp(this.pz, s.min[2], s.max[2]);
        const dx = this.px - nx;
        const dz = this.pz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= PLAYER_RADIUS * PLAYER_RADIUS) continue;
        hit = true;

        if (d2 > 1e-8) {
          const d = Math.sqrt(d2);
          const push = PLAYER_RADIUS - d;
          this.px += (dx / d) * push;
          this.pz += (dz / d) * push;
          // Kill the velocity component going into the surface, keep the one
          // along it. This is the slide.
          const dot = this.vx * (dx / d) + this.vz * (dz / d);
          if (dot < 0) {
            this.vx -= dot * (dx / d);
            this.vz -= dot * (dz / d);
          }
        } else {
          // Dead centre of a box: pick the shallowest face and leave by it.
          const left = this.px - s.min[0];
          const right = s.max[0] - this.px;
          const back = this.pz - s.min[2];
          const front = s.max[2] - this.pz;
          const m = Math.min(left, right, back, front);
          if (m === left) this.px = s.min[0] - PLAYER_RADIUS;
          else if (m === right) this.px = s.max[0] + PLAYER_RADIUS;
          else if (m === back) this.pz = s.min[2] - PLAYER_RADIUS;
          else this.pz = s.max[2] + PLAYER_RADIUS;
          this.vx = 0;
          this.vz = 0;
        }
      }
      if (!hit) break;
    }
  }
}

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;
