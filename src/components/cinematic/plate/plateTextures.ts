import { plateUrl, type PlateId } from "@/content/scenes";

/**
 * Plate texture cache.
 *
 * A decoded 1672×941 plate is roughly 6 MB of GPU memory. Holding all five
 * would be 30 MB for a backdrop, which is not a reasonable thing to ask of a
 * phone, so only the plates near the camera stay resident and the rest are
 * released. Loads are keyed and de-duplicated: scrolling quickly through the
 * journey must not start the same download twice.
 *
 * Upload state matches what three.js used for these plates, so the pixels the
 * shader samples are identical: sRGB internal format (the GPU decodes to
 * linear on sampling), flipped, not premultiplied, no colour-space conversion,
 * linear filtering, clamped, no mipmaps.
 *
 * Plates arrive as ImageBitmaps decoded and flipped off the main thread, so
 * the upload is a straight copy. Uploading an <img> made the main thread flip
 * and convert every pixel first — 40–70 ms a plate on a laptop, several times
 * that on a phone. Where a browser ignores the bitmap's `flipY` option (it is
 * checked once, not assumed), plates fall back to the <img> path.
 */

interface Entry {
  texture: WebGLTexture | null;
  size: [number, number];
  loading: boolean;
  /** Journey ticks since this plate was last asked for. */
  idle: number;
}

const entries = new Map<PlateId, Entry>();
let gl: WebGL2RenderingContext | null = null;
/** Bumped whenever the context changes, so a late load never uploads into a dead one. */
let generation = 0;
let canvasWidth = 1280;

export function bindPlateContext(context: WebGL2RenderingContext | null): void {
  gl = context;
  generation += 1;
}

export function setPlateCanvasWidth(width: number): void {
  canvasWidth = Math.max(320, Math.round(width));
}

function entryFor(id: PlateId): Entry {
  let entry = entries.get(id);
  if (!entry) {
    entry = { texture: null, size: [1672, 941], loading: false, idle: 0 };
    entries.set(id, entry);
  }
  return entry;
}

let bitmapFlip: Promise<boolean> | null = null;

/** Whether createImageBitmap honours `imageOrientation: "flipY"` here. */
function bitmapFlipWorks(): Promise<boolean> {
  bitmapFlip ??= (async () => {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") return false;
    try {
      // One column, red over blue. Flipped, the top pixel is blue.
      const pixels = new ImageData(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]), 1, 2);
      const bitmap = await createImageBitmap(pixels, { imageOrientation: "flipY" });
      const context = new OffscreenCanvas(1, 2).getContext("2d");
      if (!context) return false;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const top = context.getImageData(0, 0, 1, 1).data;
      return top[2]! > 200 && top[0]! < 50;
    } catch {
      return false;
    }
  })();
  return bitmapFlip;
}

interface DecodedPlate {
  readonly source: ImageBitmap | HTMLImageElement;
  /** True when the source still needs flipping at upload (the <img> path). */
  readonly flipOnUpload: boolean;
  readonly width: number;
  readonly height: number;
}

async function decodePlate(url: string): Promise<DecodedPlate> {
  if (await bitmapFlipWorks()) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Plate ${url} responded ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob(), {
      imageOrientation: "flipY",
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    });
    return { source: bitmap, flipOnUpload: false, width: bitmap.width, height: bitmap.height };
  }

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return { source: image, flipOnUpload: true, width: image.naturalWidth, height: image.naturalHeight };
}

/**
 * Creates a texture with the plate upload state. The source is a 1×1 pixel,
 * an <img> (flipped here), or an ImageBitmap (already flipped — WebGL ignores
 * the unpack flags for bitmaps).
 */
export function createPlateTexture(
  context: WebGL2RenderingContext,
  source: TexImageSource | Uint8Array,
  flipY: boolean,
): WebGLTexture {
  const texture = context.createTexture()!;
  context.bindTexture(context.TEXTURE_2D, texture);
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, flipY);
  context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  context.pixelStorei(context.UNPACK_COLORSPACE_CONVERSION_WEBGL, context.NONE);
  context.pixelStorei(context.UNPACK_ALIGNMENT, 4);
  if (source instanceof Uint8Array) {
    context.texImage2D(context.TEXTURE_2D, 0, context.SRGB8_ALPHA8, 1, 1, 0, context.RGBA, context.UNSIGNED_BYTE, source);
  } else {
    context.texImage2D(context.TEXTURE_2D, 0, context.SRGB8_ALPHA8, context.RGBA, context.UNSIGNED_BYTE, source);
  }
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
  // The camera samples beyond the edges during a push; clamping keeps that
  // as a stretched edge pixel rather than a wrapped copy of the far wall.
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
  return texture;
}

/** Kicks off a load if needed and returns the texture once it is ready. */
export function requestPlate(id: PlateId): WebGLTexture | null {
  const entry = entryFor(id);
  entry.idle = 0;

  if (entry.texture) return entry.texture;
  if (entry.loading || !gl) return null;

  entry.loading = true;
  const loadGeneration = generation;

  decodePlate(plateUrl(id, canvasWidth))
    .then((plate) => {
      entry.loading = false;
      // The canvas was torn down, its context lost, or the cache cleared and
      // this plate re-requested while this load was in flight.
      if (!gl || loadGeneration !== generation || entries.get(id) !== entry) {
        if ("close" in plate.source) plate.source.close();
        return;
      }
      entry.texture = createPlateTexture(gl, plate.source, plate.flipOnUpload);
      entry.size = [plate.width, plate.height];
      if ("close" in plate.source) plate.source.close();
    })
    .catch(() => {
      // Leave it unloaded; the next frame that asks will try again.
      entry.loading = false;
    });

  return null;
}

export function plateSize(id: PlateId): [number, number] {
  return entries.get(id)?.size ?? [1672, 941];
}

export function isPlateReady(id: PlateId): boolean {
  return Boolean(entries.get(id)?.texture);
}

/**
 * Ages every plate that was not requested this frame and frees the ones that
 * have been unused for a while. Called once per journey tick, not per frame.
 */
export function sweepPlates(keep: readonly PlateId[], maxIdle = 240): void {
  for (const [id, entry] of entries) {
    if (keep.includes(id)) {
      entry.idle = 0;
      continue;
    }
    entry.idle += 1;
    if (entry.idle > maxIdle && entry.texture) {
      gl?.deleteTexture(entry.texture);
      entry.texture = null;
    }
  }
}

/**
 * Releases everything. Called when the cinematic layer unmounts, and when the
 * context is lost — in which case the textures are already gone and only the
 * bookkeeping is cleared.
 */
export function disposePlates({ contextLost = false } = {}): void {
  for (const entry of entries.values()) {
    if (entry.texture && !contextLost) gl?.deleteTexture(entry.texture);
    entry.texture = null;
  }
  entries.clear();
}
