"use client";

import { useEffect, useRef } from "react";
import { FILM_SECONDS_PER_STAGE } from "@/content/journey";
import styles from "./Journey.module.css";

/**
 * THE FILM — one continuous shot behind the homepage opening.
 *
 * Sections opt in with `data-film-key="<n>"`. While a section is under the
 * middle of the viewport the film holds on keyframe n; in the last part of
 * the section it plays on to the next section's keyframe. Scrolling back
 * plays it in reverse. Scroll is never hijacked: the page scrolls normally
 * and the film follows.
 *
 * Decorative. Every word is in the sections, in HTML. Without JavaScript the
 * first keyframe shows as a still; under reduced motion or Save-Data no video
 * is fetched and the still changes to each section's keyframe instead.
 */

const HOLD = 0.45; // share of a section spent holding still on its keyframe
const still = (key: number) => `/journey/k${key}.webp`;

export function JourneyFilm() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const layer = layerRef.current!;
    const video = videoRef.current!;
    const img = imgRef.current!;
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const filmOn = !reduced && !nav.connection?.saveData;

    let target = 0;
    let shown = 0;
    let stillKey = 0;
    let raf = 0;
    let measureQueued = 0;

    if (filmOn) {
      video.src = window.innerWidth < 820 ? "/journey/film-540.mp4" : "/journey/film-720.mp4";
      video.addEventListener("loadeddata", () => layer.setAttribute("data-video", ""), { once: true });
    }

    // iOS only paints seeked frames after the video has played once.
    const unlock = () => {
      video.play().then(() => video.pause(), () => {});
    };
    if (filmOn) window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    if (filmOn) window.addEventListener("touchstart", unlock, { once: true, passive: true });

    const sections = () => [...document.querySelectorAll<HTMLElement>("[data-film-key]")];

    const measure = () => {
      measureQueued = 0;
      const list = sections();
      const line = window.innerHeight * 0.5;
      let i = -1;
      list.forEach((s, n) => {
        if (s.getBoundingClientRect().top <= line) i = n;
      });
      const first = list[0]?.getBoundingClientRect();
      const last = list[list.length - 1]?.getBoundingClientRect();
      const visible = !!first && !!last && first.top < window.innerHeight && last.bottom > 0;

      layer.toggleAttribute("data-hidden", !visible);
      root.toggleAttribute("data-film", visible);
      if (i < 0) i = 0;

      const cur = list[i];
      const next = list[i + 1];
      if (!cur) return;
      const r = cur.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (line - r.top) / r.height));
      const a = Number(cur.dataset.filmKey);
      const b = next ? Number(next.dataset.filmKey) : a;
      const t = Math.min(1, Math.max(0, (p - HOLD) / (1 - HOLD)));
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      target = (a + (b - a) * eased) * FILM_SECONDS_PER_STAGE;

      if (!filmOn) {
        const key = eased > 0.5 ? b : a;
        if (key !== stillKey) {
          stillKey = key;
          img.src = still(key);
        }
        return;
      }
      if (!raf) raf = requestAnimationFrame(step);
    };

    // Ease the film toward the scroll position so it moves like a camera, not a slider.
    const step = () => {
      raf = 0;
      shown += (target - shown) * 0.14;
      if (Math.abs(target - shown) < 0.004) shown = target;
      if (video.readyState >= 1) {
        const t = Math.min(shown, (video.duration || shown + 1) - 0.05);
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
      }
      if (shown !== target) raf = requestAnimationFrame(step);
    };

    const onScroll = () => {
      if (!measureQueued) measureQueued = requestAnimationFrame(measure);
    };

    measure();
    shown = target;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    video.addEventListener("loadedmetadata", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(measureQueued);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      root.removeAttribute("data-film");
    };
  }, []);

  return (
    <div ref={layerRef} className={styles.film} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- swapped by script under reduced motion; next/image would fight that */}
      <img ref={imgRef} src={still(0)} alt="" className={styles.still} fetchPriority="high" decoding="async" />
      <video ref={videoRef} className={styles.video} muted playsInline preload="auto" disablePictureInPicture />
      <div className={styles.grade} />
    </div>
  );
}
