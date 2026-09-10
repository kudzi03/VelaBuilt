/**
 * The VelaBuilt monogram.
 *
 * Drawn from the supplied master artwork: a chisel-cut blade forming the V,
 * and a B built from two open swashes rather than closed bowls. It is a
 * sculptural mark, not a typographic one — the earlier version set it as a
 * didone V beside a conventional B, which is a different logo.
 *
 * Vector rather than an image so it stays crisp at any size, inherits colour,
 * and can carry the brushed-metal gradient without a second asset.
 */

interface MonogramProps {
  readonly className?: string;
  readonly title?: string;
  /** Brushed champagne, as the mark appears on dark ground. */
  readonly metal?: boolean;
}

/** The blade of the V. */
const V_BLADE = "M21.2 28.2 L29.0 31.8 L50.8 90.2 L46.2 96.8 Z";

/** The upper swash of the B. */
const B_UPPER =
  "M45.0 24.6 C63.0 22.2 74.6 30.2 72.6 42.2 C70.8 51.6 62.6 57.0 53.6 57.8 C61.0" +
  " 51.8 66.2 44.6 64.8 37.4 C63.4 30.6 55.4 25.8 45.0 24.6 Z";

/** The lower swash. */
const B_LOWER =
  "M51.0 59.4 C70.4 57.2 82.4 66.4 79.8 79.4 C77.4 91.0 66.0 96.6 54.4 95.6 C64.8" +
  " 90.0 71.4 81.4 69.8 72.6 C68.2 64.6 61.4 60.4 51.0 59.4 Z";

export function Monogram({ className, title, metal = false }: MonogramProps) {
  const gradientId = "vb-metal";

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill={metal ? `url(#${gradientId})` : "currentColor"}
    >
      {title ? <title>{title}</title> : null}

      {metal ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8e7042" />
            <stop offset="28%" stopColor="#f3e2c7" />
            <stop offset="52%" stopColor="#e0c398" />
            <stop offset="78%" stopColor="#f0dcba" />
            <stop offset="100%" stopColor="#8e7042" />
          </linearGradient>
        </defs>
      ) : null}

      <path d={V_BLADE} />
      <path d={B_UPPER} />
      <path d={B_LOWER} />
    </svg>
  );
}

/**
 * Monogram plus wordmark. The wordmark is set in the display serif, matching
 * the identity's own web application of the brand.
 */
export function Wordmark({ className }: { readonly className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <Monogram className="h-7 w-auto text-[color:var(--color-champagne)]" />
      <span
        className="text-[1.35rem] leading-none tracking-[0.01em] text-[color:var(--color-ivory)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        VelaBuilt
      </span>
    </span>
  );
}
