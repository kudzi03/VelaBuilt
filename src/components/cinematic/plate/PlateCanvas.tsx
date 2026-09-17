"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS, clamp01, damp, journey } from "@/lib/journey";
import type { Tier } from "@/lib/capability";
import { SCENES, type Scene } from "@/content/scenes";
import { labRoom } from "@/components/lab/labRoom";
import {
  PLATE_FRAGMENT,
  PLATE_FRAGMENT_PREFIX,
  PLATE_VERTEX,
  PLATE_VERTEX_PREFIX,
} from "./plateShader";
import {
  bindPlateContext,
  createPlateTexture,
  disposePlates,
  isPlateReady,
  plateSize,
  requestPlate,
  setPlateCanvasWidth,
  sweepPlates,
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
 * Plain WebGL2. One quad and one program never needed a scene graph: three.js
 * and its React renderer were 235 KB of script (889 KB decoded) evaluated on
 * every capable device, for a draw call. Colour handling, upload state and
 * shader preamble reproduce what three.js did, so the frames are the same.
 *
 * Loaded only on capable devices, only after the page is interactive, and
 * always behind semantic HTML that already said everything the scene shows.
 */

type ActiveTier = Exclude<Tier, "C">;

export function PlateCanvas({
  tier,
  onReady,
  onFailure,
}: {
  readonly tier: ActiveTier;
  /** Called once the first frame with a real plate has been drawn. */
  readonly onReady?: () => void;
  /** Called if WebGL2 or the shader is unavailable, so the stage keeps its stills. */
  readonly onFailure?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const failureRef = useRef(onFailure);

  useEffect(() => {
    readyRef.current = onReady;
    failureRef.current = onFailure;
  }, [onReady, onFailure]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startCompositor(
      canvas,
      tier,
      () => readyRef.current?.(),
      () => failureRef.current?.(),
    );
  }, [tier]);

  return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />;
}

/* -------------------------------------------------------------------------- */

const UNIFORM_NAMES = [
  "uPlateA", "uPlateB", "uMix", "uSamePlate", "uBlurA", "uBlurB", "uCut",
  "uResolution", "uPlateSize",
  "uFocalA", "uFocalB", "uZoomA", "uZoomB", "uPanA", "uPanB",
  "uHorizonA", "uHorizonB", "uLateralA", "uLateralB", "uParallax",
  "uExposureA", "uExposureB", "uContrastA", "uContrastB",
  "uSaturationA", "uSaturationB", "uWarmthA", "uWarmthB",
  "uBloomA", "uBloomB", "uHazeA", "uHazeB",
  "uVignette", "uGrain", "uTime", "uQuality", "uDim", "uSpot",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];
type Locations = Record<UniformName, WebGLUniformLocation | null>;

interface Gpu {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly buffers: WebGLBuffer[];
  readonly fallback: WebGLTexture;
  readonly u: Locations;
}

/**
 * A program whose compile and link have been requested but not yet asked
 * about. Asking — any status, attribute or uniform query — makes the browser
 * finish the work synchronously on the main thread. On a cold GPU process that
 * was ~270 ms for this shader, so with KHR_parallel_shader_compile the result
 * is polled once a frame instead, and the page stays responsive meanwhile.
 */
interface PendingProgram {
  readonly program: WebGLProgram;
  readonly vertex: WebGLShader;
  readonly fragment: WebGLShader;
  readonly parallel: { readonly COMPLETION_STATUS_KHR: number } | null;
}

function beginProgram(gl: WebGL2RenderingContext): PendingProgram {
  const shader = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  };
  const vertex = shader(gl.VERTEX_SHADER, PLATE_VERTEX_PREFIX + PLATE_VERTEX);
  const fragment = shader(gl.FRAGMENT_SHADER, PLATE_FRAGMENT_PREFIX + PLATE_FRAGMENT);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return { program, vertex, fragment, parallel: gl.getExtension("KHR_parallel_shader_compile") };
}

/** Non-blocking where the extension exists; without it, the first query blocks. */
function programSettled(gl: WebGL2RenderingContext, pending: PendingProgram): boolean {
  return pending.parallel
    ? Boolean(gl.getProgramParameter(pending.program, pending.parallel.COMPLETION_STATUS_KHR))
    : true;
}

function finishGpu(gl: WebGL2RenderingContext, pending: PendingProgram): Gpu {
  const { program, vertex, fragment } = pending;
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = [gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment), gl.getProgramInfoLog(program)]
      .filter(Boolean)
      .join("\n");
    throw new Error(`Plate shader failed to build: ${log}`);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  // The quad three.js built as PlaneGeometry(2, 2): clip-space corners, UVs
  // with (0, 0) at the bottom left.
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const quad = (name: string, size: number, data: number[]) => {
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, name);
    if (location >= 0) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }
    return buffer;
  };
  const buffers = [
    quad("position", 3, [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
    quad("uv", 2, [0, 0, 1, 0, 0, 1, 1, 1]),
  ];
  gl.bindVertexArray(null);

  const u = Object.fromEntries(
    UNIFORM_NAMES.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Locations;

  // A 1×1 near-black texture so the shader always has something bound, even
  // before the first plate has decoded.
  const fallback = createPlateTexture(gl, new Uint8Array([5, 5, 6, 255]), false);

  // Opaque, no depth, no blending: a single full-frame write. Dithering off,
  // as three.js set it for a non-dithered material — it changes how the
  // 8-bit output rounds.
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DITHER);
  gl.clearColor(5 / 255, 5 / 255, 6 / 255, 1);

  return { gl, program, vao, buffers, fallback, u };
}

function destroyGpu(gpu: Gpu): void {
  const { gl } = gpu;
  if (gl.isContextLost()) return;
  gl.deleteProgram(gpu.program);
  gl.deleteVertexArray(gpu.vao);
  for (const buffer of gpu.buffers) gl.deleteBuffer(buffer);
  gl.deleteTexture(gpu.fallback);
}

/** Starts the compositor on a canvas. Returns its teardown. */
function startCompositor(
  canvas: HTMLCanvasElement,
  tier: ActiveTier,
  onReady: () => void,
  onFailure: () => void,
): () => void {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
    // Refuse a software-rendered context. On a CPU rasteriser (a blocklisted
    // GPU, a VM, a remote desktop) this shader ran at 3 fps and delayed clicks
    // by 6–9 seconds — with the previous three.js renderer as with this one.
    // Those devices get the stills, which is what Tier C is for.
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) {
    onFailure();
    return () => {};
  }

  const dprRange: readonly [number, number] = tier === "A" ? [1, 2] : [1, 1.5];
  const parallax = tier === "A" ? 0.95 : 0.7;
  const quality = tier === "A" ? 1 : 0;

  let gpu: Gpu | null = null;
  let pending: PendingProgram | null = null;
  /** Set once a frame has been drawn with a real plate, not the fallback. */
  let shown = false;
  let frame = 0;
  let stopped = false;
  let needsRender = true;
  let cssWidth = 1;
  let cssHeight = 1;
  const startedAt = performance.now();
  let lastFrameAt = startedAt;

  // Plate currently bound per slot, so a slot holds its last room while the
  // next one decodes, exactly as the uniform values used to.
  let boundA: WebGLTexture | null = null;
  let boundB: WebGLTexture | null = null;

  let dim = 0;
  const spot: [number, number, number] = [0.5, 0.5, 0.4];
  let sweepTick = 0;

  /**
   * A cut is committed. Scroll chooses *when* the room changes; time carries
   * the change itself from beginning to end.
   *
   * Driving the dissolve from scroll position let a visitor park the page at a
   * 50/50 blend of two photographs and sit there — the one thing that reads
   * unmistakably as a double exposure rather than as a place. No film lets you
   * scrub a cut, and neither does this.
   */
  const cutMs = () => (journey.reducedMotion ? 380 : 900);
  let shownIndex = 0;
  let cutting = false;
  let cutFrom = 0;
  let cutTo = 0;
  let cutAt = 0;

  const init = () => {
    bindPlateContext(gl);
    gpu = null;
    pending = beginProgram(gl);
  };

  /** Promotes a finished compile into a usable program. False until then, or if it failed. */
  const settle = (): boolean => {
    if (gpu) return true;
    if (!pending || !programSettled(gl, pending)) return false;
    try {
      gpu = finishGpu(gl, pending);
      boundA = gpu.fallback;
      boundB = gpu.fallback;
      pending = null;
      return true;
    } catch (error) {
      console.error(error);
      pending = null;
      stopped = true;
      onFailure();
      return false;
    }
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(1, rect.width);
    cssHeight = Math.max(1, rect.height);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, dprRange[0]), dprRange[1]);
    const width = Math.floor(cssWidth * dpr);
    const height = Math.floor(cssHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    setPlateCanvasWidth(cssWidth);
    needsRender = true;
  };

  const render = (now: number) => {
    if (!gpu) return;
    const { u } = gpu;
    const delta = Math.min(0.05, (now - lastFrameAt) / 1000);
    lastFrameAt = now;

    // Which room the camera is in, and which one it is walking into.
    const station = clamp01(journey.smooth) * (CHAPTERS.length - 1);
    const nearest = Math.max(0, Math.min(SCENES.length - 1, Math.round(station)));

    // The room being walked toward stays resident whether or not a cut has
    // begun. Leaving it out of the sweep's keep-list below deletes the texture
    // that is about to be sampled, and a deleted texture samples black.
    const approaching = SCENES[nearest]!.plate;
    requestPlate(approaching);

    // Begin the cut only once the next room has actually decoded, otherwise a
    // slow network cuts to flat black.
    if (!cutting && nearest !== shownIndex) {
      if (isPlateReady(approaching)) {
        cutting = true;
        cutFrom = shownIndex;
        cutTo = nearest;
        cutAt = now;
      }
    }

    let cut = 0;
    if (cutting) {
      cut = clamp01((now - cutAt) / cutMs());
      if (cut >= 1) {
        shownIndex = cutTo;
        cutting = false;
        cut = 0;
      }
    }

    const fromIndex = cutting ? cutFrom : shownIndex;
    const toIndex = cutting ? cutTo : shownIndex;
    const from = SCENES[fromIndex]!;
    const to = SCENES[toIndex]!;

    const textureA = requestPlate(from.plate);
    const textureB = requestPlate(to.plate);
    boundA = textureA ?? boundA;
    boundB = textureB ?? textureA ?? boundB;

    const samePlate = from.plate === to.plate;
    // Two chapters in one room: the camera simply keeps travelling through it,
    // so there is nothing to light and nothing to blur.
    const shot = cutting && !samePlate && !journey.reducedMotion;
    const eased = cut * cut * (3 - 2 * cut);
    const flash = shot ? Math.sin(Math.PI * cut) : 0;

    // The compositor is cropped to the portrait band on tall screens, so it
    // reframes to the same part of the room the CSS plate would. Measured on
    // the canvas, not the viewport: any canvas taller than it is wide reframes.
    const portrait = cssWidth / Math.max(1, cssHeight) < 1;

    // The lab room reacts: dim everything but the selected chain.
    dim = damp(dim, labRoom.active ? labRoom.dim : 0, 0.002, delta);
    spot[0] = damp(spot[0], labRoom.spot[0], 0.004, delta);
    spot[1] = damp(spot[1], labRoom.spot[1], 0.004, delta);
    spot[2] = damp(spot[2], labRoom.spot[2], 0.004, delta);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(gpu.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, boundA);
    gl.uniform1i(u.uPlateA, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, boundB);
    gl.uniform1i(u.uPlateB, 1);

    gl.uniform1f(u.uMix, cutting ? eased : 0);
    gl.uniform1f(u.uSamePlate, samePlate ? 1 : 0);
    gl.uniform2f(u.uResolution, cssWidth, cssHeight);
    const [pw, ph] = plateSize(from.plate);
    gl.uniform2f(u.uPlateSize, pw, ph);

    // The outgoing room accelerates away from camera while the incoming one
    // arrives deep and settles. That, rather than the blend, is what makes a
    // change of room read as a move.
    applyScene(gl, u, from, "A", progressFor(station, fromIndex), shot ? 0.12 * cut * cut : 0, portrait);
    applyScene(gl, u, to, "B", progressFor(station, toIndex), shot ? 0.16 * (1 - eased) : 0, portrait);

    gl.uniform1f(u.uBlurA, shot ? flash * 0.055 : 0);
    gl.uniform1f(u.uBlurB, shot ? flash * 0.042 : 0);
    gl.uniform1f(u.uCut, shot ? cut : 0);

    // Depth separates hardest exactly while the camera is moving hardest.
    gl.uniform1f(u.uParallax, parallax * (1 + flash * 0.8));
    gl.uniform1f(u.uVignette, 0.42);
    gl.uniform1f(u.uGrain, 0.015);
    gl.uniform1f(u.uTime, (now - startedAt) / 1000);
    gl.uniform1f(u.uQuality, quality);
    gl.uniform1f(u.uDim, dim);
    gl.uniform3f(u.uSpot, spot[0], spot[1], spot[2]);

    gl.bindVertexArray(gpu.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);

    // Reveal the canvas only once it shows the room, never the black fallback.
    if (!shown && textureA) {
      shown = true;
      onReady();
    }

    // Release plates we have walked away from, a few times a second.
    sweepTick += 1;
    if (sweepTick % 30 === 0) sweepPlates([from.plate, to.plate, approaching]);
  };

  // Draw every frame while the journey is on screen — the compositor is cheap
  // enough that gating on movement would cost more in stutter than it saves —
  // and stop entirely once the section leaves the viewport.
  const loop = (now: number) => {
    if (stopped) return;
    frame = requestAnimationFrame(loop);
    // Nothing to draw with until the shader has finished building.
    if (!settle()) return;
    // Off screen: skip the frame, but only once the room has been shown. The
    // frame clock keeps running, so the first frame back takes the (clamped)
    // full step, as the previous renderer's clock did.
    if (!journey.visible && !needsRender && shown) return;
    needsRender = false;
    render(now);
  };

  const observer = new ResizeObserver(resize);

  const onContextLost = (event: Event) => {
    // Keep the context restorable, and forget everything that lived on it.
    event.preventDefault();
    cancelAnimationFrame(frame);
    disposePlates({ contextLost: true });
    bindPlateContext(null);
    gpu = null;
    pending = null;
  };

  const onContextRestored = () => {
    if (stopped) return;
    init();
    needsRender = true;
    frame = requestAnimationFrame(loop);
  };

  init();

  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  observer.observe(canvas);
  resize();
  frame = requestAnimationFrame(loop);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    disposePlates();
    if (gpu) destroyGpu(gpu);
    bindPlateContext(null);
    // Hand the context back rather than waiting for the browser's cap on live
    // contexts to evict it.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

/**
 * Writes one scene's camera and grade into the A or B uniform slot.
 *
 * `progress` is how far the camera has travelled through this scene's own
 * chapter, so every room keeps moving whether or not a cut is running.
 * `zoomBoost` is the momentary push a cut adds on top of that.
 */
/**
 * How far the camera has travelled through one scene's chapter: 0 as the room
 * comes into view, 1 as it leaves. Continuous across a boundary, so a room's
 * camera never jumps at the moment the cut to the next room begins.
 */
function progressFor(station: number, index: number): number {
  return clamp01(station - index + 0.5);
}

function applyScene(
  gl: WebGL2RenderingContext,
  u: Locations,
  scene: Scene,
  slot: "A" | "B",
  progress: number,
  zoomBoost: number,
  portrait: boolean,
): void {
  const eased = progress * progress * (3 - 2 * progress);

  const zoom = scene.zoom[0] + (scene.zoom[1] - scene.zoom[0]) * eased + zoomBoost;
  const pan = scene.pan[0] + (scene.pan[1] - scene.pan[0]) * eased;

  const focal = portrait ? scene.portraitFocal : scene.focal;
  gl.uniform2f(u[`uFocal${slot}`], focal[0], focal[1]);
  gl.uniform1f(u[`uZoom${slot}`], zoom);
  gl.uniform2f(u[`uPan${slot}`], pan, pan * -0.35);

  gl.uniform1f(u[`uHorizon${slot}`], scene.horizon);
  gl.uniform1f(u[`uLateral${slot}`], scene.lateral);

  const g = scene.grade;
  gl.uniform1f(u[`uExposure${slot}`], g.exposure);
  gl.uniform1f(u[`uContrast${slot}`], g.contrast);
  gl.uniform1f(u[`uSaturation${slot}`], g.saturation);
  gl.uniform1f(u[`uWarmth${slot}`], g.warmth);
  gl.uniform1f(u[`uBloom${slot}`], g.bloom);
  gl.uniform1f(u[`uHaze${slot}`], g.haze);
}
