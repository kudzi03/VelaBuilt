"use client";

import { useEffect, useState } from "react";
import { CHAPTERS, subscribeToChapter } from "@/lib/journey";

/**
 * Orientation, and a way out.
 *
 * The visitor always knows where they are in the journey and can leave it at
 * any point — every marker is a real anchor link. Nothing here traps scroll or
 * forces anyone through six chapters to reach the part they came for.
 *
 * Hidden below large screens, where the mobile experience is designed instead.
 */
export function ChapterIndex() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeToChapter(setActive), []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Chapters"
      data-visible={visible}
      className="pointer-events-none fixed right-[max(1.25rem,3vw)] top-1/2 z-30 hidden -translate-y-1/2 opacity-0 transition-opacity duration-700 data-[visible=true]:pointer-events-auto data-[visible=true]:opacity-100 xl:block"
    >
      <ol className="flex flex-col gap-4">
        {CHAPTERS.map((chapter) => {
          const isActive = chapter.index === active;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center justify-end gap-3"
              >
                <span
                  data-active={isActive}
                  className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-faint)] opacity-0 transition-all duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 data-[active=true]:text-[color:var(--color-champagne)] data-[active=true]:opacity-100"
                >
                  {chapter.label}
                </span>
                <span
                  aria-hidden="true"
                  data-active={isActive}
                  className="h-px w-5 bg-[color:var(--color-faint)] transition-all duration-500 group-hover:w-8 data-[active=true]:w-9 data-[active=true]:bg-[color:var(--color-champagne)]"
                />
                <span className="sr-only">
                  Scene {chapter.scene}: {chapter.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
