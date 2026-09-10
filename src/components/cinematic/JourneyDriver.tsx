"use client";

import { useEffect } from "react";
import { CHAPTERS, clamp01, damp, journey, setChapter } from "@/lib/journey";

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

    /**
     * Scroll position at which each chapter section sits centred in the
     * viewport. The chapters are not equal heights — a chapter with a system
     * lab in it is far taller than the destination — so mapping scroll to the
     * corridor linearly would put the camera in the wrong room while the
     * reader is in the right one. Anchoring station i to section i means the
     * camera arrives exactly when the reader does.
     */
    let anchors: number[] = [];

    const measureAnchors = () => {
      const viewport = window.innerHeight;
      anchors = CHAPTERS.map((chapter) => {
        const section = document.getElementById(chapter.id);
        if (!section) return 0;
        const rect = section.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return Math.max(0, top + rect.height / 2 - viewport / 2);
      });

      // Guard against a section failing to render: anchors must ascend.
      for (let i = 1; i < anchors.length; i += 1) {
        if (anchors[i]! <= anchors[i - 1]!) anchors[i] = anchors[i - 1]! + 1;
      }
    };

    const measure = () => {
      if (anchors.length !== CHAPTERS.length) measureAnchors();

      const scrolled = window.scrollY;
      const last = CHAPTERS.length - 1;

      let station = 0;
      if (scrolled <= anchors[0]!) {
        station = 0;
      } else if (scrolled >= anchors[last]!) {
        station = last;
      } else {
        for (let i = 0; i < last; i += 1) {
          const from = anchors[i]!;
          const to = anchors[i + 1]!;
          if (scrolled >= from && scrolled < to) {
            station = i + (scrolled - from) / (to - from);
            break;
          }
        }
      }

      journey.progress = clamp01(station / last);
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
      // Section heights change with the viewport, so the anchors must be
      // re-derived rather than reused.
      anchors = [];
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
