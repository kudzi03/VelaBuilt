/**
 * The VelaBuilt monogram: an interlocked V and B drawn with didone stroke
 * contrast — thick stems, thin arms, fine serifs. Drawn as vector rather than
 * set as type so it holds its proportions at every size and in the 3D world.
 */

interface MonogramProps {
  readonly className?: string;
  readonly title?: string;
}

export function Monogram({ className, title }: MonogramProps) {
  return (
    <svg
      viewBox="0 0 52 44"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeLinecap="butt"
    >
      {title ? <title>{title}</title> : null}
      {/* V — thick left stem, thin right arm */}
      <path d="M4 7 L16.5 37" strokeWidth="3.1" />
      <path d="M16.5 37 L29 7" strokeWidth="1.15" />
      {/* Fine serifs at the V terminals */}
      <path d="M0.8 6.6 H8" strokeWidth="1.05" />
      <path d="M25.6 6.6 H32.2" strokeWidth="1.05" />
      {/* B — stem interlocked with the V's rising arm */}
      <path d="M27.4 7 L27.4 37" strokeWidth="3.1" />
      <path
        d="M28.8 7.6 H37.2 A7.1 7.1 0 0 1 37.2 21.4 H28.8"
        strokeWidth="1.3"
      />
      <path
        d="M28.8 21.4 H38.6 A7.9 7.9 0 0 1 38.6 36.6 H28.8"
        strokeWidth="1.3"
      />
      {/* Stem serifs */}
      <path d="M23.9 7 H30.9" strokeWidth="1.05" />
      <path d="M23.9 37 H30.9" strokeWidth="1.05" />
    </svg>
  );
}

/** Monogram plus wordmark, as used in the header and footer. */
export function Wordmark({ className }: { readonly className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <Monogram className="h-6 w-auto text-[color:var(--color-champagne)]" />
      <span
        className="text-[1.35rem] leading-none tracking-[0.01em] text-[color:var(--color-ivory)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        VelaBuilt
      </span>
    </span>
  );
}
