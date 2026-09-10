import { plateSource, type PlateId } from "@/content/scenes";

/**
 * The building, behind an inner page.
 *
 * Service pages, the lab, the work index and the enquiry all open in the same
 * architecture as the homepage rather than on a gradient — one universe, not a
 * cinematic homepage bolted to a conventional site.
 *
 * Held well back: this is a room the copy is standing in, not a picture the
 * copy is sitting on. The plate is heavily graded down and the text carries a
 * shield of its own, so contrast never depends on where the image is bright.
 *
 * Server-rendered, no client JavaScript, and decorative — the page's meaning
 * never depends on it, so it is hidden from assistive technology.
 */
export function PageBackdrop({
  plate,
  focal = [0.5, 0.45],
  /** 0–1. How present the room is behind the copy. */
  presence = 0.42,
  className,
}: {
  readonly plate: PlateId;
  readonly focal?: readonly [number, number];
  readonly presence?: number;
  readonly className?: string;
}) {
  const source = plateSource(plate);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url("${source.placeholder}")`, opacity: presence }}
      />

      <picture>
        <source type="image/avif" srcSet={source.avifSrcSet} sizes="100vw" />
        <source type="image/webp" srcSet={source.webpSrcSet} sizes="100vw" />
        <img
          src={source.webp}
          alt=""
          decoding="async"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%`,
            opacity: presence,
          }}
        />
      </picture>

      {/* Falls to black at the foot of the section so the page below it
          continues seamlessly instead of ending on a visible seam. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(5 5 6 / 0.62) 0%, rgb(5 5 6 / 0.34) 34%, rgb(5 5 6 / 0.78) 82%, rgb(5 5 6) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgb(5 5 6 / 0.78) 0%, rgb(5 5 6 / 0.4) 48%, rgb(5 5 6 / 0.28) 100%)",
        }}
      />
      <span className="grain absolute inset-0" />
    </div>
  );
}
