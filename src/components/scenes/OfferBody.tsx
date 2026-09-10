import Link from "next/link";
import type { Service } from "@/content/services";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, Label } from "@/components/ui/Primitives";
import { StartProjectLink } from "@/components/enquiry/StartProjectLink";
import type { Focus } from "@/content/enquiry-flow";

/**
 * The readable half of an offer chapter: the problem in the buyer's words,
 * the proposition, and the capabilities kept deliberately secondary to both.
 */
export function OfferBody({
  service,
  focus,
  children,
}: {
  readonly service: Service;
  readonly focus: Focus;
  readonly children?: React.ReactNode;
}) {
  return (
    <div className="mt-14 grid gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
      <Reveal delay={80}>
        <Label tone="champagne">
          {service.index} — {service.name}
        </Label>

        <p className="lede mt-6 max-w-[46ch] text-[color:var(--color-ivory)]">
          {service.proposition}
        </p>

        <ul className="mt-9 flex flex-col gap-3.5">
          {service.problems.slice(0, 4).map((problem) => (
            <li key={problem} className="flex gap-4 text-sm text-[color:var(--color-muted)]">
              <span
                aria-hidden="true"
                className="mt-2.5 h-px w-4 shrink-0 bg-[color:var(--color-champagne-deep)]"
              />
              <span>{problem}</span>
            </li>
          ))}
        </ul>

        <div className="mt-11 flex flex-wrap items-center gap-4">
          <StartProjectLink variant="secondary" focus={focus}>
            {service.cta}
          </StartProjectLink>
          <Link href={`/${service.slug}`} className="btn btn-ghost">
            <span className="inline-flex items-center gap-3">
              How it works
              <ArrowRight />
            </span>
          </Link>
        </div>
      </Reveal>

      <Reveal delay={160}>
        {children}

        <div className={children ? "mt-12" : undefined}>
          <Label>What that involves</Label>
          <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {service.capabilities.map((capability) => (
              <li
                key={capability}
                className="border-b border-[color:var(--color-hairline)] pb-3 text-sm text-[color:var(--color-ivory-dim)]"
              >
                {capability}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-[color:var(--color-muted)]">
            {service.boundary}
          </p>
        </div>
      </Reveal>
    </div>
  );
}
