import * as THREE from "three";
import { plateUrl, type PlateId } from "@/content/scenes";

/**
 * Plate texture cache.
 *
 * A decoded 1672×941 plate is roughly 6 MB of GPU memory. Holding all five
 * would be 30 MB for a backdrop, which is not a reasonable thing to ask of a
 * phone, so only the plates near the camera stay resident and the rest are
 * released. Loads are keyed and de-duplicated: scrolling quickly through the
 * journey must not start the same download twice.
 */

interface Entry {
  texture: THREE.Texture | null;
  promise: Promise<THREE.Texture> | null;
  /** Journey ticks since this plate was last asked for. */
  idle: number;
}

const entries = new Map<PlateId, Entry>();
let loader: THREE.TextureLoader | null = null;
let canvasWidth = 1280;

export function setPlateCanvasWidth(width: number): void {
  canvasWidth = Math.max(320, Math.round(width));
}

function entryFor(id: PlateId): Entry {
  let entry = entries.get(id);
  if (!entry) {
    entry = { texture: null, promise: null, idle: 0 };
    entries.set(id, entry);
  }
  return entry;
}

/** Kicks off a load if needed and returns the texture once it is ready. */
export function requestPlate(id: PlateId): THREE.Texture | null {
  const entry = entryFor(id);
  entry.idle = 0;

  if (entry.texture) return entry.texture;
  if (entry.promise) return null;

  loader ??= new THREE.TextureLoader();

  entry.promise = loader.loadAsync(plateUrl(id, canvasWidth)).then((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    // The camera samples beyond the edges during a push; clamping keeps that
    // as a stretched edge pixel rather than a wrapped copy of the far wall.
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    entry.texture = texture;
    entry.promise = null;
    return texture;
  });

  return null;
}

export function plateSize(id: PlateId): [number, number] {
  const texture = entries.get(id)?.texture;
  const image = texture?.image as { width?: number; height?: number } | undefined;
  return [image?.width ?? 1672, image?.height ?? 941];
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
      entry.texture.dispose();
      entry.texture = null;
    }
  }
}

/** Releases everything. Called when the cinematic layer unmounts. */
export function disposePlates(): void {
  for (const entry of entries.values()) {
    entry.texture?.dispose();
    entry.texture = null;
    entry.promise = null;
  }
  entries.clear();
}
