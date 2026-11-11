"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { chapter as chapterFor } from "./chapters";
import { setChapter } from "./store";

/**
 * THE STAGE — one fixed layer behind every page: the salt pan at night.
 *
 * It lives in the root layout, so it is never torn down between routes. It
 * also drives the chapters: the section under the middle of the viewport
 * names the chapter the header and the instrument strip show.
 *
 * Entirely decorative to assistive technology.
 */
export function VelaStage() {
  const pathname = usePathname();

  /* Chapters. The only scroll listener on the site. */
  useEffect(() => {
    let raf = 0;
    let current = "";
    const mobileQuery = window.matchMedia("(max-width: 819px)");

    const read = () => {
      raf = 0;
      const line = window.innerHeight * 0.5;
      let found: string | null = null;
      for (const el of document.querySelectorAll<HTMLElement>("[data-chapter]")) {
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) found = el.dataset.chapter ?? null;
      }
      const next = chapterFor(found);
      if (next && next.id !== current) {
        current = next.id;
        setChapter(next, mobileQuery.matches);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    // Route changes: re-read once the new page is in the DOM.
    const settle = window.setTimeout(read, 30);
    read();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return <div className="vela-bg" aria-hidden="true" />;
}
