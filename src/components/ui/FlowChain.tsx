import { Fragment } from "react";

/**
 * A sequence, drawn as the route it is.
 *
 * This used to be outlined rectangles joined by arrows — a wireframe of the
 * one thing VelaBuilt actually sells, and the cheapest-looking element on the
 * site. It is now the signal path in miniature: a node for each stage, a rule
 * between them, the label sitting under its own node. Same data, same
 * semantics, same <ol>; it simply stops looking like a placeholder for a
 * diagram someone meant to draw later.
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
    <ol className={`flex flex-wrap items-start gap-x-2 gap-y-5 ${className ?? ""}`}>
      {steps.map((step, index) => (
        <Fragment key={step}>
          <li
            data-emphasised={emphasise === index}
            className="group flex min-w-[4.5rem] flex-col items-start gap-2.5 text-[0.75rem] uppercase tracking-[0.2em] text-[color:var(--color-ivory-dim)] transition-colors duration-500 data-[emphasised=true]:text-[color:var(--color-champagne)]"
          >
            <span
              aria-hidden="true"
              className="block h-[7px] w-[7px] rotate-45 border border-[rgb(224_195_152/0.4)] transition-colors duration-500 group-data-[emphasised=true]:border-[color:var(--color-champagne)] group-data-[emphasised=true]:bg-[color:var(--color-champagne)]"
            />
            {step}
          </li>

          {index < steps.length - 1 ? (
            <li
              aria-hidden="true"
              className="mt-[3px] h-px w-5 shrink-0 bg-[rgb(224_195_152/0.22)]"
            />
          ) : null}
        </Fragment>
      ))}
    </ol>
  );
}
