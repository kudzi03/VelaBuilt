import { plateSource, type PlateId } from "@/content/scenes";

/**
 * The plate as an ordinary responsive image.
 *
 * This is the first paint for everyone and the complete environment for Tier C
 * — reduced motion, absent WebGL, constrained device, data saver, or no
 * JavaScript at all. It is the same architecture the compositor renders, so a
 * visitor who never gets the canvas is not given a diagram of the world; they
 * are given the world, held still.
 *
 * Server-rendered, no client JavaScript.
 */
export function CssPlate({
  plate,
  alt,
  priority = false,
  className,
  /** Focal point kept in frame as the viewport crops the plate. */
  focal = [0.5, 0.5],
  portraitFocal,
  dim = 1,
}: {
  readonly plate: PlateId;
  readonly alt: string;
  readonly priority?: boolean;
  readonly className?: string;
  readonly focal?: readonly [number, number];
  /** Framing used once the plate is cropped to the portrait band. */
  readonly portraitFocal?: readonly [number, number];
  readonly dim?: number;
}) {
  const source = plateSource(plate);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {/* The blurred stand-in sits underneath, so the frame is already the
          right colours before the full plate decodes. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-105 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url("${source.placeholder}")` }}
      />

      <picture>
        <source type="image/avif" srcSet={source.avifSrcSet} sizes="100vw" />
        <source type="image/webp" srcSet={source.webpSrcSet} sizes="100vw" />
        <img
          src={source.webp}
          alt={alt}
          decoding={priority ? "sync" : "async"}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          className="plate-img absolute inset-0 h-full w-full object-cover"
          style={{
            // Custom properties rather than a direct object-position, so the
            // portrait band can reframe in CSS at its own breakpoint.
            ["--plate-pos" as string]: `${focal[0] * 100}% ${focal[1] * 100}%`,
            ["--plate-pos-portrait" as string]: `${(portraitFocal ?? focal)[0] * 100}% ${(portraitFocal ?? focal)[1] * 100}%`,
            opacity: dim,
          }}
        />
      </picture>

      {/* Grade, so the still matches what the compositor produces. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 34%, rgb(5 5 6 / 0.5) 82%, rgb(5 5 6 / 0.82) 100%)",
        }}
      />
      <span aria-hidden="true" className="grain absolute inset-0" />
    </div>
  );
}
