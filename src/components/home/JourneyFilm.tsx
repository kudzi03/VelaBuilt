"use client";

import { useEffect, useRef } from "react";
import { FILM_SECONDS_PER_STAGE } from "@/content/journey";
import styles from "./Journey.module.css";

/**
 * THE FILM — one continuous shot behind the homepage opening.
 *
 * Sections opt in with `data-film-key="<n>"`. When a section scrolls into
 * place, the film *plays* from where it is to keyframe n at normal speed
 * (faster if the visitor has skipped ahead), then holds. Playing, rather than
 * seeking on every scroll frame, is what keeps it smooth: decoding forward is
 * cheap, random seeks are not. Going back fades to that keyframe's still and
 * settles the video underneath it.
 *
 * Scroll is never hijacked; the page scrolls normally and the film follows.
 * Decorative: every word is in the sections. Without JavaScript the first
 * keyframe shows as a still; under reduced motion or Save-Data no video is
 * fetched and the still changes to each section's keyframe instead.
 */

const BASE_RATE = 1.25; // a 5-second transition plays in 4
const MAX_RATE = 4;
const LINE = 0.6; // a section becomes current when its top passes 60% of the viewport
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

    let key = -1; // the keyframe the film is heading to
    let raf = 0;
    let queued = 0;
    let ready = false;

    const showStill = (k: number) => {
      const src = still(k);
      if (!img.src.endsWith(src)) img.src = src;
    };

    // Watch playback until the target keyframe is reached, then hold on it exactly.
    const watch = () => {
      raf = 0;
      const target = key * FILM_SECONDS_PER_STAGE;
      if (video.currentTime >= target - 0.02 || video.ended) {
        video.pause();
        if (Math.abs(video.currentTime - target) > 0.04) video.currentTime = target;
        return;
      }
      const behind = (target - video.currentTime) / FILM_SECONDS_PER_STAGE;
      video.playbackRate = Math.min(MAX_RATE, BASE_RATE * Math.max(1, behind));
      raf = requestAnimationFrame(watch);
    };

    const goTo = (k: number) => {
      if (k === key) return;
      const back = k < key;
      key = k;
      showStill(k);
      if (!filmOn || !ready) return;
      cancelAnimationFrame(raf);
      const target = k * FILM_SECONDS_PER_STAGE;
      if (back || video.currentTime > target) {
        // Reverse playback isn't native; fade to the still and settle underneath it.
        video.pause();
        layer.removeAttribute("data-video");
        video.currentTime = target;
        video.addEventListener("seeked", () => key === k && layer.setAttribute("data-video", ""), { once: true });
        return;
      }
      layer.setAttribute("data-video", "");
      video.play().then(() => (raf = requestAnimationFrame(watch)), () => {
        // Autoplay refused (rare for muted inline video): stay on the still.
        layer.removeAttribute("data-video");
      });
    };

    const measure = () => {
      queued = 0;
      const list = [...document.querySelectorAll<HTMLElement>("[data-film-key]")];
      if (!list.length) return;
      const vh = window.innerHeight;
      const first = list[0]!.getBoundingClientRect();
      const last = list[list.length - 1]!.getBoundingClientRect();
      const visible = first.top < vh && last.bottom > 0;
      layer.toggleAttribute("data-hidden", !visible);
      // The instrument strip sits on the bottom edge: it reads light only while the film is behind it.
      root.toggleAttribute("data-film", visible && last.bottom > vh - 64);

      let current = list[0]!;
      for (const s of list) if (s.getBoundingClientRect().top <= vh * LINE) current = s;
      goTo(Number(current.dataset.filmKey));
    };

    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(measure);
    };

    if (filmOn) {
      video.src = window.innerWidth < 820 ? "/journey/film-720.mp4" : "/journey/film-1080.mp4";
      video.addEventListener(
        "loadeddata",
        () => {
          ready = true;
          // Land on the right frame if the page opened part-way down.
          const k = key;
          key = -1;
          video.currentTime = Math.max(0, k) * FILM_SECONDS_PER_STAGE;
          video.addEventListener("seeked", () => {
            key = k;
            layer.setAttribute("data-video", "");
            onScroll();
          }, { once: true });
        },
        { once: true },
      );
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.pause();
      root.removeAttribute("data-film");
    };
  }, []);

  return (
    <div ref={layerRef} className={styles.film} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- swapped by script per chapter; next/image would fight that */}
      <img ref={imgRef} src={still(0)} alt="" className={styles.still} fetchPriority="high" decoding="async" />
      <video ref={videoRef} className={styles.video} muted playsInline preload="auto" disablePictureInPicture />
      <div className={styles.grade} />
    </div>
  );
}
