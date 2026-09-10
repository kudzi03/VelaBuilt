/**
 * THE CSS WORLD.
 *
 * Painted on the first frame, before any JavaScript decides anything, and the
 * complete experience for Tier C — reduced motion, no WebGL, constrained
 * device or data saver. The corridor, the champagne horizon and the lit floor
 * seams exist here in gradients and transforms alone.
 *
 * On Tier A and B this stays behind the canvas: it is what a visitor sees for
 * the fraction of a second before the corridor mounts, and what they keep if
 * the context is ever lost. It never blanks.
 *
 * Server-rendered, no client JavaScript.
 */

export function StaticWorld({
  /** 0→1 vertical placement of the horizon within the frame. */
  horizon = 0.52,
  intensity = 1,
  grid = true,
  className,
}: {
  readonly horizon?: number;
  readonly intensity?: number;
  readonly grid?: boolean;
  readonly className?: string;
}) {
  const top = `${horizon * 100}%`;

  return (
    <div
      aria-hidden="true"
      className={`horizon-field ${className ?? ""}`}
      style={{ opacity: intensity }}
    >
      {/* Champagne horizon: the light the whole identity is built around. */}
      <span className="horizon-bloom" style={{ top }} />
      <span className="horizon-line" style={{ top }} />

      {/* Architectural seams down each side of the frame. */}
      <span
        className="absolute inset-y-0 left-[8%] w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgb(201 164 107 / 0.22) 38%, rgb(201 164 107 / 0.05) 72%, transparent)",
        }}
      />
      <span
        className="absolute inset-y-0 right-[8%] w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgb(201 164 107 / 0.22) 38%, rgb(201 164 107 / 0.05) 72%, transparent)",
        }}
      />

      {grid ? <span className="floor-grid" style={{ top }} /> : null}

      <span className="vignette" />
      <span className="grain" />
    </div>
  );
}
