/**
 * THE CINEMATIC PLATES.
 *
 * Each chapter of the journey is a real environment render, used as the scene's
 * production art. Everything a still cannot do — parallax, camera movement,
 * reactive light, atmosphere — is layered around it by the compositor.
 *
 * The numbers below are camera direction, not decoration:
 *
 *   focal     The vanishing point the camera pushes toward, in plate space.
 *             Get this wrong and a dolly reads as a crude zoom.
 *   horizon   Where the floor meets the architecture. The depth ramp pivots
 *             here: below it is near floor, above it is far. This is what
 *             makes the foreground overtake the background under motion.
 *   lateral   How much the frame edges read as near. High in colonnaded
 *             scenes where columns pass close to camera.
 *   grade     Per-scene exposure and warmth. The chambers are not all lit the
 *             same, and grading them identically flattens the sequence.
 */

import type { ChapterId } from "@/lib/journey";
import lqip from "./plate-lqip.json";

export type PlateId =
  | "atrium"
  | "website-chamber"
  | "enquiry-chamber"
  | "system-lab"
  | "gateway";

export interface PlateGrade {
  /** Stops of exposure. Negative darkens. */
  readonly exposure: number;
  /** 1 is neutral. Above 1 deepens the blacks. */
  readonly contrast: number;
  readonly saturation: number;
  /** Warm tint strength toward champagne. */
  readonly warmth: number;
  /** Luminance-keyed bloom on the practicals. */
  readonly bloom: number;
  /** Atmospheric haze in the distance. */
  readonly haze: number;
}

export interface Scene {
  readonly chapter: ChapterId;
  readonly plate: PlateId;
  /** Described for screen readers; the plate is content, not decoration. */
  readonly alt: string;
  readonly focal: readonly [number, number];
  /**
   * Where to frame when the plate is cropped to the portrait band. A 16:9
   * room cropped to a phone shows about a quarter of its width, so each room
   * names the part of itself that still reads as a place.
   */
  readonly portraitFocal: readonly [number, number];
  readonly horizon: number;
  readonly lateral: number;
  /** Camera push across the chapter: [entering, leaving]. 1 is native scale. */
  readonly zoom: readonly [number, number];
  /** Lateral drift across the chapter, in plate widths. */
  readonly pan: readonly [number, number];
  readonly grade: PlateGrade;
}

const BASE_GRADE: PlateGrade = {
  exposure: 0,
  contrast: 1.06,
  saturation: 1.04,
  warmth: 0.16,
  bloom: 0.5,
  haze: 0.3,
};

export const SCENES: readonly Scene[] = [
  {
    chapter: "friction",
    plate: "atrium",
    alt: "A monumental dark atrium in polished black stone. Suspended glass panels carry the words People, Systems, Ideas, Infrastructure. A man in a suit walks away from camera across the reflective floor, past a lit tree, toward a glazed wall with a distant sunset beyond.",
    focal: [0.5, 0.56],
    // The glazed wall, the tree and the horizon beyond it.
    portraitFocal: [0.73, 0.54],
    horizon: 0.63,
    lateral: 0.9,
    zoom: [0.995, 1.045],
    pan: [-0.012, 0.014],
    grade: { ...BASE_GRADE, exposure: 0.06, bloom: 0.56, haze: 0.34 },
  },
  {
    chapter: "website",
    plate: "website-chamber",
    alt: "The same building, seen toward a lit portal. Monumental black glass surfaces carry the VelaBuilt mark and the words A More Capable Tomorrow. The floor throws long champagne reflections toward a glazed opening onto a mountain sunset.",
    focal: [0.52, 0.55],
    // The lit portal at the centre of the chamber.
    portraitFocal: [0.5, 0.56],
    horizon: 0.66,
    lateral: 1.0,
    zoom: [1.0, 1.06],
    pan: [0.016, -0.01],
    grade: { ...BASE_GRADE, exposure: 0.02, contrast: 1.09, bloom: 0.62 },
  },
  {
    chapter: "enquiry",
    plate: "enquiry-chamber",
    alt: "A vast dark hall in which glass slabs hang far apart, each labelled for a different system — website enquiries, email, calendar, CRM, spreadsheets, WhatsApp, booking, notes. A thin champagne thread runs between them. The man stands alone at the centre.",
    focal: [0.52, 0.5],
    // The man, with the nearest scattered systems around him.
    portraitFocal: [0.36, 0.5],
    horizon: 0.68,
    lateral: 0.78,
    zoom: [1.0, 1.05],
    pan: [-0.02, 0.018],
    grade: { ...BASE_GRADE, exposure: -0.04, contrast: 1.1, warmth: 0.13, haze: 0.4 },
  },
  {
    chapter: "lab",
    plate: "system-lab",
    alt: "A circular chamber lit in champagne. A dark sphere carrying the VelaBuilt mark is suspended at its centre, ringed by illuminated architecture. Glass stations stand around the perimeter, labelled CRM, Follow-up, Booking, Calendar, AI Assistance and Data.",
    focal: [0.5, 0.47],
    portraitFocal: [0.5, 0.46],
    horizon: 0.62,
    lateral: 0.7,
    zoom: [1.03, 0.995],
    pan: [0.008, -0.008],
    grade: { ...BASE_GRADE, exposure: 0.04, bloom: 0.68, haze: 0.26 },
  },
  {
    chapter: "discoverability",
    plate: "gateway",
    alt: "An open hall facing an enormous illuminated globe laced with light. Black stone slabs on either side carry the words Discover, Build, Automate, Grow. The man stands small at the centre of the composition.",
    focal: [0.5, 0.45],
    portraitFocal: [0.5, 0.46],
    horizon: 0.64,
    lateral: 0.85,
    // Arrives wide and cool, reading the structure from a distance.
    zoom: [1.0, 1.06],
    pan: [-0.01, 0.0],
    grade: {
      ...BASE_GRADE,
      exposure: -0.06,
      saturation: 0.9,
      warmth: 0.07,
      bloom: 0.44,
      haze: 0.42,
    },
  },
  {
    chapter: "destination",
    plate: "gateway",
    alt: "The same hall, warmer and closer. Light floods from the horizon behind the globe and the man walks toward it across the reflective floor, the systems still lit behind him.",
    focal: [0.5, 0.46],
    portraitFocal: [0.5, 0.47],
    horizon: 0.64,
    lateral: 0.7,
    // Continues the same camera rather than cutting: scene 05 hands over.
    zoom: [1.0, 1.055],
    pan: [0.0, 0.006],
    grade: {
      ...BASE_GRADE,
      exposure: 0.22,
      saturation: 1.1,
      warmth: 0.24,
      bloom: 0.95,
      haze: 0.2,
    },
  },
] as const;

export function sceneFor(chapter: ChapterId): Scene {
  const found = SCENES.find((scene) => scene.chapter === chapter);
  if (!found) throw new Error(`No scene for chapter: ${chapter}`);
  return found;
}

/** Widths generated by scripts/build-plates.mjs. */
const WIDTHS = [640, 960, 1280, 1672] as const;

export interface PlateSource {
  readonly avif: string;
  readonly webp: string;
  readonly avifSrcSet: string;
  readonly webpSrcSet: string;
  readonly placeholder: string;
  readonly aspect: number;
}

const PLACEHOLDERS = lqip as Record<string, { src: string; aspect: number }>;

export function plateSource(id: PlateId): PlateSource {
  const meta = PLACEHOLDERS[id];
  const set = (extension: "avif" | "webp") =>
    WIDTHS.map((width) => `/cinematic/${id}-${width}.${extension} ${width}w`).join(", ");

  return {
    avif: `/cinematic/${id}-1280.avif`,
    webp: `/cinematic/${id}-1280.webp`,
    avifSrcSet: set("avif"),
    webpSrcSet: set("webp"),
    placeholder: meta?.src ?? "",
    aspect: meta?.aspect ?? 16 / 9,
  };
}

/** Best single URL for a given canvas width — used by the WebGL compositor. */
export function plateUrl(id: PlateId, canvasWidth: number): string {
  const target = canvasWidth * (typeof devicePixelRatio === "number" ? Math.min(devicePixelRatio, 2) : 1);
  const width = WIDTHS.find((candidate) => candidate >= target) ?? WIDTHS[WIDTHS.length - 1];
  return `/cinematic/${id}-${width}.avif`;
}
