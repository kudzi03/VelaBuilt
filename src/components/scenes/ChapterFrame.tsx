import type { ReactNode } from "react";
import type { Chapter } from "@/lib/journey";
import { Label } from "@/components/ui/Primitives";

/**
 * One chapter of the journey.
 *
 * The camera outside is travelling; this is the readable half. Each chapter is
 * a plain <section> with a real heading, so the page's outline stands on its
 * own with the canvas switched off entirely.
 */
export function ChapterFrame({
  chapter,
  id,
  headingId,
  children,
  className,
}: {
  readonly chapter: Chapter;
  readonly id: string;
  readonly headingId: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-chapter={chapter.index}
      className={`relative flex min-h-[100svh] flex-col justify-center py-28 lg:py-36 ${className ?? ""}`}
    >
      <div className="shell w-full">
        <div className="mb-10 flex items-center gap-5">
          <Label tone="champagne" as="span">
            Scene {chapter.scene}
          </Label>
          <span aria-hidden="true" className="seam h-px w-14 shrink-0" />
          <Label as="span">{chapter.label}</Label>
        </div>
        {children}
      </div>
    </section>
  );
}
