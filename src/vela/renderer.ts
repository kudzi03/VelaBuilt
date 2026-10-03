/**
 * THE ARMATURE — renderer.
 *
 * Raw WebGL2. No three.js: every surface in this object is a custom shader,
 * so a scene graph would have been ~130 KB of plumbing around six programs.
 *
 * Per frame, on the CPU (all of it small):
 *   · 192 node positions — staggered travel between structures, drift,
 *     contraction by voice state
 *   · member and pane alphas — the outgoing structure dissolves as its nodes
 *     leave; the incoming one forms as they land
 *   · energy — pulses that travel along members and hop across joints,
 *     inward while Vela listens, outward while it speaks
 * Embers and smoke are animated entirely on the GPU.
 *
 * The loop sleeps when the tab is hidden, when a solid sheet covers the
 * viewport, and — under reduced motion — between state changes.
 */

import {
  buildArmature,
  SHAPES,
  unionEdges,
  unionFaces,
  type ShapeId,
  type Vec3,
} from "./geometry";
import {
  EMBER_VS,
  FACET_FS,
  FACET_VS,
  GLOW_FS,
  GLOW_VS,
  MEMBER_FS,
  MEMBER_VS,
  NODE_FS,
  NODE_VS,
  SMOKE_FS,
  SMOKE_VS,
} from "./shaders";
import { vela, type Presence } from "./store";

export type Tier = "full" | "lite";

export interface RendererOptions {
  readonly tier: Tier;
  readonly reducedMotion: boolean;
  readonly onFirstFrame?: () => void;
  readonly onFail?: () => void;
  /** Screen-space centre and radius of the object, CSS px. For the hit target. */
  readonly onLayout?: (cx: number, cy: number, r: number) => void;
}

/* ── behaviour per presence ─────────────────────────────────────────── */

type Flow = "random" | "inward" | "outward";
interface Profile {
  contract: number;
  spin: number;
  spawn: number;
  flow: Flow;
  speed: number;
  energy: number;
  core: number;
}

const PROFILE: Record<Presence, Profile> = {
  dormant: { contract: 1, spin: 0.05, spawn: 1.1, flow: "random", speed: 0.5, energy: 0.55, core: 0.3 },
  aware: { contract: 1.035, spin: 0.07, spawn: 2.6, flow: "random", speed: 0.7, energy: 0.8, core: 0.45 },
  connecting: { contract: 0.95, spin: 0.14, spawn: 7, flow: "inward", speed: 1.4, energy: 0.9, core: 0.55 },
  listening: { contract: 0.9, spin: 0.03, spawn: 3, flow: "inward", speed: 0.85, energy: 0.75, core: 0.6 },
  thinking: { contract: 0.93, spin: 0.24, spawn: 18, flow: "random", speed: 1.9, energy: 1, core: 0.75 },
  speaking: { contract: 1.02, spin: 0.07, spawn: 3, flow: "outward", speed: 1.05, energy: 1, core: 0.8 },
  acting: { contract: 1, spin: 0.16, spawn: 12, flow: "random", speed: 1.6, energy: 1, core: 0.75 },
};

/** How each structure is held in space: the armature turns, the others are posed. */
const POSE: Record<ShapeId, { yaw: number | null; pitch: number; smoke: number; embers: number; drift: number }> = {
  armature: { yaw: null, pitch: 0.16, smoke: 1, embers: 1, drift: 1 },
  planes: { yaw: -0.62, pitch: 0.2, smoke: 0, embers: 0.15, drift: 0.35 },
  aperture: { yaw: 0, pitch: 0.05, smoke: 0.8, embers: 1, drift: 0.6 },
  circuit: { yaw: 0.28, pitch: 0.22, smoke: 0, embers: 0.15, drift: 1 },
  lattice: { yaw: 0.62, pitch: 0.34, smoke: 0, embers: 0.15, drift: 0.15 },
  frame: { yaw: -0.3, pitch: 0.08, smoke: 0, embers: 0.1, drift: 0 },
};

const EMBER = [0.98, 0.52, 0.14] as const;
const GRAPHITE = [0.09, 0.085, 0.078] as const;

/* ── small matrix kit (column-major, like GL) ───────────────────────── */

type M4 = Float32Array;

function perspective(fovy: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function model(tx: number, ty: number, s: number, yaw: number, pitch: number): M4 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  // R = Rx(pitch) * Ry(yaw), then scale, then translate.
  // prettier-ignore
  return new Float32Array([
    cy * s, sx * sy * s, -cx * sy * s, 0,
    0, cx * s, sx * s, 0,
    sy * s, -sx * cy * s, cx * cy * s, 0,
    tx, ty, 0, 1,
  ]);
}

/* ── GL helpers ─────────────────────────────────────────────────────── */

/**
 * Starts compiling and linking, and asks nothing back. Querying a shader's
 * status forces the driver to finish it on the spot, which on a phone is the
 * single longest thing this file does; `finish()` asks later, once
 * KHR_parallel_shader_compile says the work is done (or a frame has passed).
 */
function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const v = shader(gl.VERTEX_SHADER, vs);
  const f = shader(gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  return {
    p,
    finish() {
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getShaderInfoLog(v) || gl.getShaderInfoLog(f) || gl.getProgramInfoLog(p);
        throw new Error(log ?? "program link failed");
      }
    },
    u(name: string) {
      if (!uniforms.has(name)) uniforms.set(name, gl.getUniformLocation(p, name));
      return uniforms.get(name)!;
    },
  };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

type Prog = ReturnType<typeof program>;

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a: number, b: number, rate: number, dt: number) => a + (b - a) * (1 - Math.exp(-rate * dt));

/* ── the renderer ───────────────────────────────────────────────────── */

export class ArmatureRenderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private opts: RendererOptions;
  private raf = 0;
  private running = false;
  private disposed = false;
  private firstFrame = false;
  private last = 0;
  private time = 0;
  private dpr = 1;
  private dprCap: number;
  private slowFrames = 0;

  private arm = buildArmature();
  private edges = unionEdges(this.arm);
  private faces = unionFaces(this.arm);
  private adjacency: number[][] = [];

  // Node state
  private from: Float32Array;
  private target: Float32Array;
  private cur: Float32Array;
  private delay: Float32Array;
  private glow: Float32Array;
  private seed: Float32Array;
  private progress: Float32Array;
  private transitionAt = -10;
  private shape: ShapeId = "armature";
  private shapeIndex = 0;

  // Member / pane state
  private edgeFrom: Float32Array;
  private edgeAlpha: Float32Array;
  private edgeGlow: Float32Array;
  private faceFrom: Float32Array;
  private faceAlpha: Float32Array;

  // Energy
  private pulses: { e: number; t: number; dir: 1 | -1; speed: number; life: number; i: number; prev: number }[] = [];
  private spawnDebt = 0;

  // Smoothed behaviour
  private p = { ...PROFILE.dormant };
  private yaw = 0.4;
  private pitch = 0.16;
  private spinAngle = 0.4;
  private smokeW = 1;
  private emberW = 1;
  private driftW = 1;
  private place = { x: 0, y: 0, scale: 1, presence: 1 };
  private levels = { input: 0, output: 0 };

  // GL resources
  /** Settles once the GL resources exist; `start()` waits for it. */
  readonly ready: Promise<boolean>;
  private progs!: Record<"member" | "node" | "glow" | "ember" | "smoke" | "facet", Prog>;
  private quad!: WebGLBuffer;
  private vaos!: Record<"member" | "node" | "glow" | "ember" | "smoke" | "facet", WebGLVertexArrayObject>;
  private bufs!: Record<"member" | "node" | "glow" | "facet", WebGLBuffer>;
  private memberData: Float32Array;
  private nodeData: Float32Array;
  private glowData: Float32Array;
  private facetData: Float32Array;
  private emberCount: number;
  private pulseMax: number;
  private smokeLayers: number;
  /** Finer joints on the phone-scale object, where they would read as beads. */
  private nodeScale: number;

  constructor(canvas: HTMLCanvasElement, opts: RendererOptions) {
    this.canvas = canvas;
    this.opts = opts;
    const lite = opts.tier === "lite";
    this.dprCap = lite ? 1.5 : 1.75;
    this.emberCount = lite ? 70 : 150;
    this.pulseMax = lite ? 48 : 96;
    this.smokeLayers = lite ? 3 : 5;
    this.nodeScale = lite ? 0.62 : 1;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: !lite,
      depth: false,
      stencil: false,
      powerPreference: lite ? "default" : "high-performance",
    });
    if (!gl) throw new Error("webgl2 unavailable");
    this.gl = gl;

    const n = this.arm.count;
    this.from = new Float32Array(n * 3);
    this.target = new Float32Array(n * 3);
    this.cur = new Float32Array(n * 3);
    this.delay = new Float32Array(n);
    this.glow = new Float32Array(n);
    this.progress = new Float32Array(n).fill(1);
    this.seed = new Float32Array(n);
    for (let i = 0; i < n; i++) this.seed[i] = ((i * 2654435761) % 1000) / 1000;
    this.writeShape(this.target, "armature");
    this.from.set(this.target);
    this.cur.set(this.target);

    this.edgeFrom = new Float32Array(this.edges.length);
    this.edgeAlpha = new Float32Array(this.edges.length);
    this.edges.forEach((e, i) => {
      const v = e.mask & 1 ? 1 : 0;
      this.edgeFrom[i] = v;
      this.edgeAlpha[i] = v;
    });
    this.faceFrom = new Float32Array(this.faces.length);
    this.faceAlpha = new Float32Array(this.faces.length);
    this.faces.forEach((f, i) => {
      const v = f.mask & 1 ? 1 : 0;
      this.faceFrom[i] = v;
      this.faceAlpha[i] = v;
    });

    this.adjacency = Array.from({ length: n }, () => [] as number[]);
    this.edges.forEach((e, i) => {
      this.adjacency[e.a]!.push(i);
      this.adjacency[e.b]!.push(i);
    });

    this.memberData = new Float32Array(this.edges.length * 8);
    this.edgeGlow = new Float32Array(this.edges.length);
    this.nodeData = new Float32Array(n * 5);
    this.glowData = new Float32Array((this.pulseMax + 2) * 4 * 1.25);
    this.facetData = new Float32Array(this.faces.length * 3 * 4);

    this.ready = this.initGL();

    canvas.addEventListener("webglcontextlost", this.onLost, false);
    document.addEventListener("visibilitychange", this.onVisibility);
    vela.invalidate = () => this.kick();
  }

  /* ── setup ─────────────────────────────────────────────────────────── */

  /**
   * Split across frames so no single task holds the main thread: compile in
   * the background, check on a later frame, build buffers on the next.
   * Resolves false if the renderer was disposed while waiting.
   */
  private async initGL(): Promise<boolean> {
    const gl = this.gl;
    const progs = {
      member: program(gl, MEMBER_VS, MEMBER_FS),
      node: program(gl, NODE_VS, NODE_FS),
      glow: program(gl, GLOW_VS, GLOW_FS),
      ember: program(gl, EMBER_VS, GLOW_FS),
      smoke: program(gl, SMOKE_VS, SMOKE_FS),
      facet: program(gl, FACET_VS, FACET_FS),
    };
    const parallel = gl.getExtension("KHR_parallel_shader_compile");
    const all = Object.values(progs);
    do {
      await nextFrame();
      if (this.disposed) return false;
    } while (parallel && !all.every((pr) => gl.getProgramParameter(pr.p, parallel.COMPLETION_STATUS_KHR)));
    all.forEach((pr) => pr.finish());
    this.progs = progs;

    await nextFrame();
    if (this.disposed) return false;

    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const mkBuf = (bytes: number) => {
      const b = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, bytes, gl.DYNAMIC_DRAW);
      return b;
    };
    this.bufs = {
      member: mkBuf(this.memberData.byteLength),
      node: mkBuf(this.nodeData.byteLength),
      glow: mkBuf(this.glowData.byteLength),
      facet: mkBuf(this.facetData.byteLength),
    };

    const withQuad = () => {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    };
    const inst = (loc: number, size: number, stride: number, offset: number) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4);
      gl.vertexAttribDivisor(loc, 1);
    };

    const member = gl.createVertexArray()!;
    gl.bindVertexArray(member);
    withQuad();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.member);
    inst(1, 3, 8, 0);
    inst(2, 3, 8, 3);
    inst(3, 1, 8, 6);
    inst(4, 1, 8, 7);

    const node = gl.createVertexArray()!;
    gl.bindVertexArray(node);
    withQuad();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.node);
    inst(1, 3, 5, 0);
    inst(2, 2, 5, 3);

    const glow = gl.createVertexArray()!;
    gl.bindVertexArray(glow);
    withQuad();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.glow);
    inst(1, 3, 5, 0);
    inst(2, 2, 5, 3);

    const ember = gl.createVertexArray()!;
    gl.bindVertexArray(ember);
    withQuad();
    const seeds = new Float32Array(this.emberCount * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.abs(seeds[i]!);
    const eb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, eb);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    inst(1, 4, 4, 0);

    const smoke = gl.createVertexArray()!;
    gl.bindVertexArray(smoke);
    withQuad();

    const facet = gl.createVertexArray()!;
    gl.bindVertexArray(facet);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.facet);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);

    gl.bindVertexArray(null);
    this.vaos = { member, node, glow, ember, smoke, facet };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }

  /* ── public control ────────────────────────────────────────────────── */

  start() {
    if (this.disposed) return;
    this.ready.then(
      (ok) => {
        if (!ok || this.disposed) return;
        this.running = true;
        this.kick();
      },
      (e: unknown) => {
        console.warn("[velabuilt] object unavailable:", e);
        this.dispose();
        this.opts.onFail?.();
      },
    );
  }

  /** Request a frame. Under reduced motion this is the only way one is drawn. */
  kick() {
    if (this.disposed || !this.running || this.raf) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    document.removeEventListener("visibilitychange", this.onVisibility);
    vela.invalidate = () => {};
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  private onLost = (e: Event) => {
    e.preventDefault();
    this.dispose();
    this.opts.onFail?.();
  };

  private onVisibility = () => {
    if (!document.hidden) {
      this.last = 0;
      this.kick();
    }
  };

  /* ── simulation ────────────────────────────────────────────────────── */

  private writeShape(out: Float32Array, id: ShapeId) {
    const pos = this.arm.shapes[id].positions;
    for (let i = 0; i < pos.length; i++) {
      out[i * 3] = pos[i]![0];
      out[i * 3 + 1] = pos[i]![1];
      out[i * 3 + 2] = pos[i]![2];
    }
  }

  private retarget(id: ShapeId) {
    this.from.set(this.cur);
    this.edgeFrom.set(this.edgeAlpha);
    this.faceFrom.set(this.faceAlpha);
    this.writeShape(this.target, id);
    this.shape = id;
    this.shapeIndex = SHAPES.indexOf(id);
    this.transitionAt = this.time;
    // A building wave: nodes seat themselves bottom-left to top-right, with
    // jitter, so the structure visibly assembles rather than cross-fading.
    const n = this.arm.count;
    for (let i = 0; i < n; i++) {
      const x = this.target[i * 3]!;
      const y = this.target[i * 3 + 1]!;
      const wave = 0.5 + (x * 0.35 + y * 0.45) / 2.2;
      this.delay[i] = Math.max(0, Math.min(1, wave)) * 0.55 + this.seed[i]! * 0.25;
      this.progress[i] = 0;
    }
    this.pulses.length = 0;
  }

  private simulate(dt: number) {
    const reduced = this.opts.reducedMotion;

    if (vela.shape !== this.shape) this.retarget(vela.shape);

    // Voice levels, when a session is live.
    const lv = vela.readLevels?.() ?? { input: 0, output: 0 };
    this.levels.input = damp(this.levels.input, lv.input, 14, dt);
    this.levels.output = damp(this.levels.output, lv.output, 10, dt);

    const target = { ...PROFILE[vela.presence] };
    if (vela.presence === "listening") {
      target.contract -= this.levels.input * 0.07;
      target.spawn += this.levels.input * 26;
      target.core += this.levels.input * 0.4;
    }
    if (vela.presence === "speaking") {
      target.contract += this.levels.output * 0.08;
      target.spawn += this.levels.output * 30;
      target.core += this.levels.output * 0.9;
      target.energy += this.levels.output * 0.4;
    }
    const rate = reduced ? 1000 : 3;
    this.p.contract = damp(this.p.contract, target.contract, rate * 1.6, dt);
    this.p.spin = damp(this.p.spin, target.spin, rate, dt);
    this.p.spawn = target.spawn;
    this.p.flow = target.flow;
    this.p.speed = damp(this.p.speed, target.speed, rate, dt);
    this.p.energy = damp(this.p.energy, target.energy, rate, dt);
    this.p.core = damp(this.p.core, target.core + vela.flare * 0.8, rate * 1.4, dt);
    vela.flare = Math.max(0, vela.flare - dt * 1.2);

    const pose = POSE[this.shape];
    this.smokeW = damp(this.smokeW, pose.smoke, reduced ? 1000 : 1.4, dt);
    this.emberW = damp(this.emberW, pose.embers, reduced ? 1000 : 1.4, dt);
    this.driftW = damp(this.driftW, pose.drift, reduced ? 1000 : 1.4, dt);

    // Placement in the frame.
    const pl = vela.placement;
    const pr = reduced ? 1000 : 2.4;
    this.place.x = damp(this.place.x, pl.x, pr, dt);
    this.place.y = damp(this.place.y, pl.y, pr, dt);
    this.place.scale = damp(this.place.scale, pl.scale, pr, dt);
    this.place.presence = damp(this.place.presence, pl.presence, pr, dt);

    // Orientation: the armature turns; posed structures hold, and every
    // structure leans slightly toward the pointer.
    this.spinAngle += this.p.spin * dt + vela.scrollVelocity * 0.0005;
    const px = vela.pointer.active ? vela.pointer.x : 0;
    const py = vela.pointer.active ? vela.pointer.y : 0;
    const lean = this.shape === "aperture" ? 0.5 : 0.22;
    let yawTarget: number;
    if (pose.yaw === null) {
      yawTarget = this.spinAngle + px * lean;
    } else {
      const sway = reduced ? 0 : Math.sin(this.time * 0.18) * 0.08;
      yawTarget = pose.yaw + sway + px * lean;
      // Leave the spin where the structure is, so the return is continuous.
      let d = yawTarget - this.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      yawTarget = this.yaw + d;
      this.spinAngle = this.yaw;
    }
    this.yaw = damp(this.yaw, yawTarget, reduced ? 1000 : 1.8, dt);
    this.pitch = damp(this.pitch, pose.pitch - py * lean * 0.6, reduced ? 1000 : 1.8, dt);

    // Nodes.
    const n = this.arm.count;
    const since = this.time - this.transitionAt;
    const k = this.p.contract;
    for (let i = 0; i < n; i++) {
      const p = reduced ? 1 : Math.min(1, Math.max(0, (since - this.delay[i]! * 1.1) / 1.15));
      this.progress[i] = p;
      const e = easeInOut(p);
      const s = this.seed[i]!;
      const drift = reduced ? 0 : 0.012 * this.driftW;
      for (let c = 0; c < 3; c++) {
        const j = i * 3 + c;
        // Mid-flight, nodes arc slightly outward: they travel, they do not slide.
        const arc = Math.sin(p * Math.PI) * 0.12 * (this.from[j]! + this.target[j]!) * 0.5;
        const d = drift * Math.sin(this.time * (0.35 + s * 0.4) + s * 40 + c * 2.1);
        this.cur[j] = (this.from[j]! + (this.target[j]! - this.from[j]!) * e + arc + d) * k;
      }
      this.glow[i] = this.glow[i]! * Math.exp(-dt * 2.6);
    }

    // Members form as both their nodes land, and dissolve as either leaves.
    const bit = 1 << this.shapeIndex;
    for (let i = 0; i < this.edges.length; i++) {
      const { a, b, mask } = this.edges[i]!;
      const pa = this.progress[a]!;
      const pb = this.progress[b]!;
      const out = this.edgeFrom[i]! * (1 - smooth(0, 0.4, Math.max(pa, pb)));
      this.edgeAlpha[i] = mask & bit ? Math.max(out, smooth(0.55, 1, Math.min(pa, pb))) : out;
    }
    for (let i = 0; i < this.faces.length; i++) {
      const { a, b, c, mask } = this.faces[i]!;
      const lo = Math.min(this.progress[a]!, this.progress[b]!, this.progress[c]!);
      const hi = Math.max(this.progress[a]!, this.progress[b]!, this.progress[c]!);
      const out = this.faceFrom[i]! * (1 - smooth(0, 0.3, hi));
      this.faceAlpha[i] = mask & bit ? Math.max(out, smooth(0.75, 1, lo)) : out;
    }

    if (!reduced) this.simulateEnergy(dt);
  }

  private radius(i: number) {
    const x = this.cur[i * 3]!, y = this.cur[i * 3 + 1]!, z = this.cur[i * 3 + 2]!;
    return Math.sqrt(x * x + y * y + z * z);
  }

  private pickDirection(e: number): 1 | -1 {
    const { a, b } = this.edges[e]!;
    const flow = this.p.flow;
    if (this.shape === "circuit") return this.cur[b * 3]! >= this.cur[a * 3]! ? 1 : -1;
    if (flow === "random") return Math.random() < 0.5 ? 1 : -1;
    const toB = this.radius(b) < this.radius(a);
    return (flow === "inward") === toB ? 1 : -1;
  }

  private simulateEnergy(dt: number) {
    const visible = (e: number) => this.edgeAlpha[e]! > 0.45;

    this.spawnDebt += this.p.spawn * dt;
    let guard = 0;
    while (this.spawnDebt >= 1 && guard++ < 24) {
      this.spawnDebt -= 1;
      if (this.pulses.length >= this.pulseMax) break;
      // A few candidates; take the one that best matches the flow.
      let best = -1;
      let bestScore = -Infinity;
      for (let tries = 0; tries < 6; tries++) {
        const e = (Math.random() * this.edges.length) | 0;
        if (!visible(e)) continue;
        const { a, b } = this.edges[e]!;
        const dr = Math.abs(this.radius(a) - this.radius(b));
        const score = this.p.flow === "random" ? Math.random() : dr + Math.random() * 0.05;
        if (score > bestScore) {
          bestScore = score;
          best = e;
        }
      }
      if (best < 0) continue;
      const dir = this.pickDirection(best);
      this.pulses.push({
        e: best,
        t: dir === 1 ? 0 : 1,
        dir,
        speed: this.p.speed * (0.7 + Math.random() * 0.6),
        life: 2 + ((Math.random() * 4) | 0),
        i: 0.55 + Math.random() * 0.45,
        prev: -1,
      });
    }

    for (let pi = this.pulses.length - 1; pi >= 0; pi--) {
      const q = this.pulses[pi]!;
      const { a, b } = this.edges[q.e]!;
      const dx = this.cur[a * 3]! - this.cur[b * 3]!;
      const dy = this.cur[a * 3 + 1]! - this.cur[b * 3 + 1]!;
      const dz = this.cur[a * 3 + 2]! - this.cur[b * 3 + 2]!;
      const length = Math.max(0.05, Math.sqrt(dx * dx + dy * dy + dz * dz));
      q.t += (q.dir * q.speed * dt) / length;
      if (q.t < 0 || q.t > 1 || !visible(q.e)) {
        const at = q.t > 1 ? b : a;
        this.glow[at] = Math.min(1, this.glow[at]! + 0.55 * q.i);
        q.life -= 1;
        if (q.life <= 0 || !visible(q.e)) {
          this.pulses.splice(pi, 1);
          continue;
        }
        // Hop across the joint onto a neighbouring member.
        const options = this.adjacency[at]!.filter((e) => e !== q.e && visible(e));
        if (!options.length) {
          this.pulses.splice(pi, 1);
          continue;
        }
        let next = options[(Math.random() * options.length) | 0]!;
        if (this.p.flow !== "random" || this.shape === "circuit") {
          let bestScore = -Infinity;
          for (const e of options) {
            const other = this.edges[e]!.a === at ? this.edges[e]!.b : this.edges[e]!.a;
            const score =
              this.shape === "circuit"
                ? this.cur[other * 3]! - this.cur[at * 3]!
                : (this.p.flow === "inward" ? 1 : -1) * (this.radius(at) - this.radius(other));
            const jitter = score + Math.random() * 0.08;
            if (jitter > bestScore) {
              bestScore = jitter;
              next = e;
            }
          }
        }
        q.prev = q.e;
        q.e = next;
        q.dir = this.edges[next]!.a === at ? 1 : -1;
        q.t = q.dir === 1 ? 0 : 1;
      }
    }
  }

  /* ── drawing ───────────────────────────────────────────────────────── */

  private resize() {
    const c = this.canvas;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    if (dpr !== this.dpr || c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      this.dpr = dpr;
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
    }
    return { w, h };
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;

    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;

    // Adaptive resolution: if frames run long, shed pixels before anything else.
    if (!this.opts.reducedMotion && dt > 0.024) {
      if (++this.slowFrames > 90 && this.dprCap > 1) {
        this.dprCap = Math.max(1, this.dprCap - 0.25);
        this.slowFrames = 0;
      }
    } else this.slowFrames = Math.max(0, this.slowFrames - 1);

    this.time += dt;
    this.simulate(dt);
    this.draw();

    if (!this.firstFrame) {
      this.firstFrame = true;
      this.opts.onFirstFrame?.();
    }

    const sleeping = document.hidden || vela.covered;
    if (this.running && !sleeping && !this.opts.reducedMotion) {
      this.raf = requestAnimationFrame(this.frame);
    } else if (this.opts.reducedMotion && this.settling()) {
      // Reduced motion still resolves state changes — just without travel.
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private settling() {
    return (
      Math.abs(this.place.x - vela.placement.x) > 1e-3 ||
      Math.abs(this.place.presence - vela.placement.presence) > 1e-3
    );
  }

  private draw() {
    const gl = this.gl;
    const { w, h } = this.resize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const presence = this.place.presence;
    if (presence < 0.01) return;

    const aspect = w / Math.max(1, h);
    const fov = (30 * Math.PI) / 180;
    const camZ = 6.5;
    const proj = perspective(fov, aspect, 0.1, 40);
    // prettier-ignore
    const view = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-camZ,1]);

    // Fit: the structure's radius (~1.15) takes a fixed share of the short side.
    const visH = 2 * Math.tan(fov / 2) * camZ;
    const visW = visH * aspect;
    const fit = Math.min(visH * 0.3, visW * 0.36) / 1.15;
    const scale = fit * this.place.scale;
    const tx = this.place.x * visW;
    const ty = this.place.y * visH;
    const m = model(tx, ty, scale, this.yaw, this.pitch);
    const centerZ = -camZ;
    const radius = 1.2 * scale;

    // Tell the hit target where the object is.
    if (this.opts.onLayout) {
      const cx = w / 2 + (tx / visW) * w;
      const cy = h / 2 - (ty / visH) * h;
      this.opts.onLayout(cx, cy, (radius / visH) * h);
    }

    const common = (pr: Prog) => {
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u("uModel"), false, m);
      gl.uniformMatrix4fv(pr.u("uView"), false, view);
      gl.uniformMatrix4fv(pr.u("uProj"), false, proj);
    };

    const n = this.arm.count;
    const cur = this.cur;

    /* smoke */
    const smokeD = this.smokeW * presence;
    if (smokeD > 0.02) {
      const pr = this.progs.smoke;
      common(pr);
      gl.bindVertexArray(this.vaos.smoke);
      gl.uniform1f(pr.u("uTime"), this.time);
      gl.uniform1i(pr.u("uOctaves"), this.opts.tier === "lite" ? 2 : 4);
      for (let l = 0; l < this.smokeLayers; l++) {
        const s = l / this.smokeLayers;
        gl.uniform1f(pr.u("uSize"), (0.5 + s * 0.4) * scale * this.p.contract);
        gl.uniform1f(pr.u("uRot"), this.time * 0.035 * (l % 2 ? 1 : -1) + l * 1.7);
        gl.uniform1f(pr.u("uSeed"), l * 0.37 + 0.11);
        gl.uniform1f(pr.u("uDensity"), 0.95 * smokeD * (1 - s * 0.3));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    /* glass */
    let fv = 0;
    for (let i = 0; i < this.faces.length; i++) {
      const alpha = this.faceAlpha[i]! * presence;
      if (alpha < 0.01) continue;
      const f = this.faces[i]!;
      for (const v of [f.a, f.b, f.c]) {
        this.facetData[fv++] = cur[v * 3]!;
        this.facetData[fv++] = cur[v * 3 + 1]!;
        this.facetData[fv++] = cur[v * 3 + 2]!;
        this.facetData[fv++] = alpha;
      }
    }
    if (fv) {
      const pr = this.progs.facet;
      common(pr);
      gl.uniform1f(pr.u("uTime"), this.time);
      gl.uniform3fv(pr.u("uEmber"), EMBER);
      gl.bindVertexArray(this.vaos.facet);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.facet);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.facetData, 0, fv);
      gl.drawArrays(gl.TRIANGLES, 0, fv / 4);
    }

    /* members — lit where energy is passing */
    const energy = this.p.energy;
    for (let i = 0; i < this.edges.length; i++) {
      const { a, b } = this.edges[i]!;
      this.edgeGlow[i] = Math.max(this.glow[a]!, this.glow[b]!) * 0.45 * energy;
    }
    for (const q of this.pulses) {
      this.edgeGlow[q.e] = Math.max(this.edgeGlow[q.e]!, q.i * 0.85 * energy);
    }
    let mv = 0;
    let members = 0;
    for (let i = 0; i < this.edges.length; i++) {
      const alpha = this.edgeAlpha[i]! * presence;
      if (alpha < 0.01) continue;
      const { a, b } = this.edges[i]!;
      this.memberData[mv++] = cur[a * 3]!;
      this.memberData[mv++] = cur[a * 3 + 1]!;
      this.memberData[mv++] = cur[a * 3 + 2]!;
      this.memberData[mv++] = cur[b * 3]!;
      this.memberData[mv++] = cur[b * 3 + 1]!;
      this.memberData[mv++] = cur[b * 3 + 2]!;
      this.memberData[mv++] = alpha * 0.7;
      this.memberData[mv++] = this.edgeGlow[i]!;
      members++;
    }
    if (members) {
      const pr = this.progs.member;
      common(pr);
      gl.uniform2f(pr.u("uViewport"), this.canvas.width, this.canvas.height);
      gl.uniform1f(pr.u("uWidth"), 1.15 * this.dpr);
      gl.uniform1f(pr.u("uFocus"), centerZ + radius * 0.25);
      gl.uniform1f(pr.u("uDof"), 1.25 / Math.max(0.1, radius));
      gl.uniform1f(pr.u("uCenterZ"), centerZ);
      gl.uniform1f(pr.u("uRadius"), radius);
      gl.uniform3fv(pr.u("uColor"), GRAPHITE);
      gl.uniform3fv(pr.u("uEmber"), EMBER);
      gl.bindVertexArray(this.vaos.member);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.member);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.memberData, 0, mv);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, members);
    }

    /* nodes — a joint shows only where a member meets it */
    for (let i = 0; i < n; i++) {
      let vis = 0;
      for (const e of this.adjacency[i]!) vis = Math.max(vis, this.edgeAlpha[e]!);
      this.nodeData[i * 5] = cur[i * 3]!;
      this.nodeData[i * 5 + 1] = cur[i * 3 + 1]!;
      this.nodeData[i * 5 + 2] = cur[i * 3 + 2]!;
      this.nodeData[i * 5 + 3] = (this.arm.depth[i]! < 0.75 ? 0.0065 : 0.0095) * this.nodeScale * Math.min(1, vis * 1.3) * presence;
      this.nodeData[i * 5 + 4] = this.glow[i]! * this.p.energy;
    }
    {
      const pr = this.progs.node;
      common(pr);
      gl.uniform1f(pr.u("uScale"), 1);
      gl.uniform1f(pr.u("uCenterZ"), centerZ);
      gl.uniform1f(pr.u("uRadius"), radius);
      gl.uniform3fv(pr.u("uEmber"), EMBER);
      gl.bindVertexArray(this.vaos.node);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.node);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.nodeData);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    }

    /* embers */
    const emberE = this.emberW * this.p.energy * presence;
    if (emberE > 0.02 && !this.opts.reducedMotion) {
      const pr = this.progs.ember;
      common(pr);
      gl.uniform1f(pr.u("uScale"), 1);
      gl.uniform1f(pr.u("uTime"), this.time);
      gl.uniform1f(pr.u("uEnergy"), emberE);
      gl.uniform1f(pr.u("uContract"), this.p.contract);
      gl.uniform3fv(pr.u("uEmber"), EMBER);
      gl.uniform1f(pr.u("uCoreBias"), 0);
      gl.bindVertexArray(this.vaos.ember);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.emberCount);
    }

    /* energy: the core, then pulses */
    let gv = 0;
    for (const q of this.pulses) {
      const { a, b } = this.edges[q.e]!;
      const t = q.t;
      const fade = Math.min(1, this.edgeAlpha[q.e]! * 1.4) * presence;
      this.glowData[gv++] = cur[a * 3]! + (cur[b * 3]! - cur[a * 3]!) * t;
      this.glowData[gv++] = cur[a * 3 + 1]! + (cur[b * 3 + 1]! - cur[a * 3 + 1]!) * t;
      this.glowData[gv++] = cur[a * 3 + 2]! + (cur[b * 3 + 2]! - cur[a * 3 + 2]!) * t;
      this.glowData[gv++] = 0.05 * (0.7 + q.i * 0.6);
      this.glowData[gv++] = q.i * this.p.energy * fade;
    }
    const pulseCount = gv / 5;
    const coreI = this.p.core * this.smokeW * presence * 0.75;
    this.glowData[gv++] = 0;
    this.glowData[gv++] = 0;
    this.glowData[gv++] = 0;
    this.glowData[gv++] = 0.34 * this.p.contract;
    this.glowData[gv++] = coreI;

    const pr = this.progs.glow;
    common(pr);
    gl.uniform1f(pr.u("uScale"), 1);
    gl.uniform3fv(pr.u("uEmber"), EMBER);
    gl.bindVertexArray(this.vaos.glow);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.glow);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.glowData, 0, gv);
    if (pulseCount) {
      gl.uniform1f(pr.u("uCoreBias"), 0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, pulseCount);
    }
    if (coreI > 0.01) {
      gl.uniform1f(pr.u("uCoreBias"), 1);
      // Draw only the last instance: offset the attribute base by re-pointing.
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufs.glow);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, pulseCount * 20);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 20, pulseCount * 20 + 12);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 20, 12);
    }
    gl.bindVertexArray(null);
  }
}

/** Positions projected to 2D for the server-rendered still. */
export type { Vec3 };
