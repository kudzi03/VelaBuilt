import type { FaqEntry } from "@/content/faq";
import { Label } from "./Primitives";
import { Reveal } from "./Reveal";

/**
 * Answer-first FAQs, built on <details> so they open without JavaScript and
 * are announced correctly by screen readers.
 *
 * Every entry rendered here is also the exact text emitted as FAQPage
 * structured data on the same page — the schema never describes content a
 * visitor cannot see.
 */
export function FaqSection({
  entries,
  heading = "Straight answers",
  id = "faq",
}: {
  readonly entries: readonly FaqEntry[];
  readonly heading?: string;
  readonly id?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="relative py-24 lg:py-32">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-24">
          <Reveal>
            <Label tone="champagne">Questions</Label>
            <h2 id={`${id}-heading`} className="display-lg mt-5 max-w-[12ch]">
              {heading}
            </h2>
          </Reveal>

          <Reveal delay={120}>
            <ul className="border-t border-[color:var(--color-hairline)]">
              {entries.map((entry) => (
                <li key={entry.question} className="border-b border-[color:var(--color-hairline)]">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-8 py-6 text-[1.05rem] text-[color:var(--color-ivory)] transition-colors duration-400 hover:text-[color:var(--color-champagne)] [&::-webkit-details-marker]:hidden">
                      <span className="max-w-[46ch]">{entry.question}</span>
                      <span
                        aria-hidden="true"
                        className="relative mt-2.5 h-3 w-3 shrink-0"
                      >
                        <span className="absolute left-0 top-1/2 h-px w-3 bg-[color:var(--color-champagne)]" />
                        <span className="absolute left-1/2 top-0 h-3 w-px bg-[color:var(--color-champagne)] transition-transform duration-500 group-open:scale-y-0" />
                      </span>
                    </summary>
                    <div className="max-w-[62ch] pb-7 pr-8 text-[0.95rem] leading-relaxed text-[color:var(--color-muted)]">
                      {entry.answer}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
