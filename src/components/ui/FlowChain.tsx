import { Fragment } from "react";

/**
 * A path through a system, shown as a path.
 *
 * Used wherever the site describes a sequence — enquiry to booking, capture to
 * report. It is an ordered list underneath, so it reads correctly in sequence
 * to a screen reader and survives with the arrows stripped out.
 */
export function FlowChain({
  steps,
  className,
  emphasise,
}: {
  readonly steps: readonly string[];
  readonly className?: string;
  /** Index of the step to mark as the current focus, if any. */
  readonly emphasise?: number;
}) {
  return (
    <ol className={`flex flex-wrap items-center gap-x-3 gap-y-3 ${className ?? ""}`}>
      {steps.map((step, index) => (
        <Fragment key={step}>
          <li
            data-emphasised={emphasise === index}
            className="border border-[color:var(--color-hairline)] px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-ivory-dim)] transition-colors duration-500 data-[emphasised=true]:border-[rgb(224_195_152/0.45)] data-[emphasised=true]:text-[color:var(--color-champagne)]"
          >
            {step}
          </li>
          {index < steps.length - 1 ? (
            <li aria-hidden="true" className="text-[color:var(--color-faint)]">
              <svg viewBox="0 0 16 8" className="h-2 w-4" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M0 4h14M11 1l3 3-3 3" />
              </svg>
            </li>
          ) : null}
        </Fragment>
      ))}
    </ol>
  );
}
