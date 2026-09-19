import { svgGatePoints, svgPath } from "@/content/signal-path";

/**
 * The same system, drawn flat.
 *
 * This is what a visitor gets with no WebGL, on a low-power device, with data
 * saver on, or with a reduced-motion preference — and it is a composition in
 * its own right rather than an empty box where a canvas failed. Same path,
 * same gates, same order, same champagne on the same obsidian.
 *
 * Decorative: every gate's name and meaning is real text in the page, so this
 * is hidden from assistive technology rather than described twice.
 */
export function SignalFallback({ lit = 1 }: { readonly lit?: number }) {
  const path = svgPath();
  const gates = svgGatePoints();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="signal-route" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0c398" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#e0c398" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#e0c398" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id="signal-glow" cx="50%" cy="8%" r="60%">
          <stop offset="0%" stopColor="#e0c398" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#e0c398" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill="url(#signal-glow)" />

      <path
        d={path}
        fill="none"
        stroke="url(#signal-route)"
        strokeWidth="0.35"
        strokeLinecap="round"
        style={{ opacity: lit }}
      />

      {gates.map(({ x, y, gate }, index) => {
        // Gates nearer the start read as established; later ones fade back,
        // which is the same "built behind, forming ahead" idea the scene
        // animates — stated once, without motion.
        const strength = 1 - index / (gates.length + 1);
        return (
          <g key={gate.id} style={{ opacity: 0.25 + strength * 0.75 }}>
            <rect
              x={x - 5.2}
              y={y - 2.1}
              width="10.4"
              height="4.2"
              fill="none"
              stroke="#e0c398"
              strokeWidth="0.22"
            />
            <circle cx={x} cy={y} r="0.5" fill="#e0c398" />
          </g>
        );
      })}
    </svg>
  );
}
