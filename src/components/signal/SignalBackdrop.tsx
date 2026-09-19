import { svgGatePoints, svgPath } from "@/content/signal-path";

/**
 * The world, held still.
 *
 * Inner pages are read, not travelled, so they get the system drawn rather
 * than running: same path, same gates, same champagne on the same obsidian as
 * the homepage, with no canvas, no renderer and no image request. It is
 * server-rendered SVG — a few hundred bytes in the HTML — which is why every
 * page outside the journey now costs less than it did when each one loaded a
 * photographic plate.
 *
 * `lean` frames the same path differently per page so the site does not
 * repeat one composition nine times, and `presence` keeps it behind the
 * reading rather than in it.
 */
export function SignalBackdrop({
  lean = "center",
  presence = 0.5,
}: {
  readonly lean?: "left" | "right" | "center";
  readonly presence?: number;
}) {
  const path = svgPath();
  const gates = svgGatePoints();

  // The same curve, seen from three positions. A single number, because a
  // backdrop that needs configuring is a backdrop that will drift.
  const shift = lean === "left" ? -22 : lean === "right" ? 22 : 0;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="signal-ground absolute inset-0" />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: presence }}
      >
        <defs>
          <linearGradient id={`backdrop-route-${lean}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0c398" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#e0c398" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e0c398" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <g transform={`translate(${shift} 0)`}>
          <path
            d={path}
            fill="none"
            stroke={`url(#backdrop-route-${lean})`}
            strokeWidth="0.28"
            strokeLinecap="round"
          />
          {gates.map(({ x, y, gate }, index) => (
            <g key={gate.id} style={{ opacity: 0.2 + (1 - index / gates.length) * 0.5 }}>
              <rect
                x={x - 5.2}
                y={y - 2.1}
                width="10.4"
                height="4.2"
                fill="none"
                stroke="#e0c398"
                strokeWidth="0.18"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
