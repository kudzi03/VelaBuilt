"use client";

import { useEffect } from "react";
import { CHAPTERS, damp, journey, setChapter } from "@/lib/journey";

/**
 * The only place scroll is read.
 *
 * One passive listener records the raw position; one rAF loop damps it and
 * publishes the result to `journey`, which the 3D camera reads every frame and
 * CSS reads through a custom property. Nothing here calls setState, so scroll
 * never triggers a React render — the reason the page stays smooth while a
 * corridor is being drawn behind it.
 *
 * Scroll is never hijacked. The visitor's wheel, trackpad, keyboard and
 * scrollbar behave exactly as they would on any other page; the camera simply
 * follows where they already are.
 */
export function JourneyDriver({ targetId }: { readonly targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const root = document.documentElement;
    let frame = 0;
    let last = performance.now();
    let previousSmooth = journey.smooth;
    let running = false;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      const scrolled = -rect.top;
      const runway = rect.height - window.innerHeight;
      journey.progress = runway > 0 ? Math.min(1, Math.max(0, scrolled / runway)) : 0;
    };

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Damped follow: the camera has weight and never snaps.
      journey.smooth = damp(journey.smooth, journey.progress, 0.0016, delta);

      journey.velocity = delta > 0 ? (journey.smooth - previousSmooth) / delta : 0;
      previousSmooth = journey.smooth;

      journey.station = journey.smooth * (CHAPTERS.length - 1);
      setChapter(Math.round(journey.station));

      root.style.setProperty("--journey", journey.smooth.toFixed(4));

      // Idle out once the camera has caught up and the visitor has stopped.
      const settled =
        Math.abs(journey.smooth - journey.progress) < 0.0002 &&
        Math.abs(journey.velocity) < 0.0004;

      if (journey.visible || !settled) {
        frame = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      measure();
      start();
    };

    const onResize = () => {
      measure();
      start();
    };

    // Only spend frames while the cinematic run is actually on screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          journey.visible = entry.isIntersecting;
          if (entry.isIntersecting) start();
        }
      },
      { threshold: 0 },
    );
    observer.observe(target);

    measure();
    // Seed the damped value so a mid-page reload does not fly through the world.
    journey.smooth = journey.progress;
    journey.station = journey.smooth * (CHAPTERS.length - 1);
    root.style.setProperty("--journey", journey.smooth.toFixed(4));
    start();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      journey.visible = false;
    };
  }, [targetId]);

  return null;
}
