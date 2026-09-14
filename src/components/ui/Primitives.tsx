import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** The wide-tracked uppercase label used throughout the identity. */
export function Label({
  children,
  tone = "muted",
  className,
  as: Tag = "p",
}: {
  readonly children: ReactNode;
  readonly tone?: "muted" | "champagne";
  readonly className?: string;
  readonly as?: "p" | "span" | "div";
}) {
  return (
    <Tag
      className={`label ${tone === "champagne" ? "label-champagne" : ""} ${className ?? ""}`}
    >
      {children}
    </Tag>
  );
}

/** Stacked vertical eyebrow, as seen down the left edge of the reference. */
export function StackedLabel({
  lines,
  className,
}: {
  readonly lines: readonly string[];
  readonly className?: string;
}) {
  return (
    <div className={className}>
      {lines.map((line) => (
        <p key={line} className="label leading-[1.75]">
          {line}
        </p>
      ))}
      <span
        aria-hidden="true"
        className="mt-4 block h-px w-8 bg-[color:var(--color-champagne-deep)]"
      />
    </div>
  );
}

/** Right-facing arrow used on every forward action. */
export function ArrowRight({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 12"
      aria-hidden="true"
      className={`h-2.5 w-6 shrink-0 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M0 6h22M17 1l5 5-5 5" />
    </svg>
  );
}

type ButtonLinkProps = {
  readonly href: string;
  readonly children: ReactNode;
  readonly variant?: "primary" | "secondary" | "ghost";
  readonly className?: string;
  readonly withArrow?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className,
  withArrow = true,
  ...rest
}: ButtonLinkProps) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const classes = `btn btn-${variant} ${className ?? ""}`;

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        rel="noopener noreferrer"
        target={href.startsWith("http") ? "_blank" : undefined}
      >
        <span>{children}</span>
        {withArrow ? <ArrowRight /> : null}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      <span>{children}</span>
      {withArrow ? <ArrowRight /> : null}
    </Link>
  );
}

/** Section heading block: label, headline, optional lede. */
export function SectionHeading({
  label,
  children,
  lede,
  id,
  level = 2,
  className,
}: {
  readonly label?: string;
  readonly children: ReactNode;
  readonly lede?: ReactNode;
  readonly id?: string;
  readonly level?: 1 | 2 | 3;
  readonly className?: string;
}) {
  const Heading = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className={className}>
      {label ? <Label tone="champagne" className="mb-5">{label}</Label> : null}
      <Heading id={id} className={level === 1 ? "display-xl" : "display-lg"}>
        {children}
      </Heading>
      {lede ? <div className="lede mt-7 max-w-[46ch]">{lede}</div> : null}
    </div>
  );
}

/**
 * Honesty badge. Every piece of work carries one; the label is not cosmetic,
 * it is the claim being made about the item.
 */
export function CategoryBadge({
  children,
  tone = "neutral",
}: {
  readonly children: ReactNode;
  readonly tone?: "neutral" | "champagne";
}) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[0.75rem] font-medium uppercase leading-none tracking-[0.24em] ${
        tone === "champagne"
          ? "border-[rgb(224_195_152/0.35)] text-[color:var(--color-champagne)]"
          : "border-[color:var(--color-hairline-strong)] text-[color:var(--color-muted)]"
      }`}
    >
      {children}
    </span>
  );
}
