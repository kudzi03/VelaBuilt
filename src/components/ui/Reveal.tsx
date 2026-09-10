"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * One shared entrance for every section on the site.
 *
 * Content is present in the DOM and readable from the first byte; this only
 * animates opacity and transform. If the observer never fires — old browser,
 * reduced motion, JS disabled — CSS leaves the content visible.
 */

interface RevealProps {
  readonly children: ReactNode;
  readonly as?: ElementType;
  readonly className?: string;
  /** Stagger within a group, in milliseconds. */
  readonly delay?: number;
  readonly id?: string;
}

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  id,
}: RevealProps) {
  // The element is chosen at runtime, but every tag we pass takes the same
  // props we set here. Narrowing to one concrete tag keeps that honest to the
  // type checker without an `any` or a polymorphic-props gymnastics layer.
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer available: reveal on the next frame rather than never.
    // A reduced-motion preference needs no branch here — the stylesheet keeps
    // .reveal fully visible, so the content is never hidden behind an effect.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${className ?? ""}`}
      data-revealed={revealed ? "true" : "false"}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
