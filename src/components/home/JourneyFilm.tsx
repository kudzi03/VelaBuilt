"use client";

import { useEffect, useRef } from "react";
import { FILM_SECONDS_PER_STAGE } from "@/content/journey";
import { createWater } from "./water";
import styles from "./Journey.module.css";

/**
 * THE FILM — one continuous shot behind the homepage opening.
 *
 * Sections opt in with `data-film-key="<n>"`. When a section scrolls into
 * place, the film *plays* from where it is to keyframe n (faster if the
 * visitor has skipped ahead), then holds. Playing, rather than seeking on
 * every scroll frame, keeps it smooth.
 *
 * It never waits on the network. The seven keyframe stills (~1 MB) load
 * before the film starts downloading. A transition plays only once that
 * stretch of the film has downloaded; until then the page crossfades between
 * the stills and the film takes over as it arrives. On a slow connection the visitor sees a calm sequence of stills,
 * never a frozen frame.
 *
 * While it holds on a keyframe the water shader (./water) keeps the frame
 * alive: ripples, reflections, lantern flicker.
 *
 * Scroll is never hijacked. Decorative: every word is in the sections.
 * Without JavaScript the first keyframe shows; under reduced motion or
 * Save-Data no video is fetched and the stills carry the whole sequence.
 */

const BASE_RATE = 1.25; // a 5-second transition plays in 4
const MAX_RATE = 4;
const LINE = 0.6; // a section becomes current when its top passes 60% of the viewport
const still = (key: number) => `/journey/k${key}.webp`;

export function JourneyFilm() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const layer = layerRef.current!;
    const video = videoRef.current!;
    const imgs = [imgARef.current!, imgBRef.current!];
    const root = document.documentElement;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; downlink?: number } };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const filmOn = !reduced && !nav.connection?.saveData;
    const slowLink = (nav.connection?.downlink ?? 10) < 5; // Mbps, where the browser reports it

    let key = -1; // the keyframe the page is showing or heading to
    let front = 0; // which still is on top
    let raf = 0;
    let queued = 0;
    let ready = false;
    let onScreen = true;
    const water = reduced ? null : createWater(waterRef.current!);

    /* Whatever the visitor is looking at, held still: give it to the water. */
    const rest = () => {
      if (!water) return;
      if (!onScreen) return water.hide();
      if (layer.hasAttribute("data-video")) {
        if (video.paused && !video.seeking && video.readyState >= 2) water.show(video, key);
        else water.hide(true);
        return;
      }
      const img = imgs[front]!;
      if (img.getAttribute("src") === still(key) && img.complete && img.naturalWidth) water.show(img, key, 1100);
      else water.hide();
    };

    /* Stills: two layers so a change is a crossfade, never a cut. */
    const showStill = (k: number) => {
      const src = still(k);
      const cur = imgs[front]!;
      if (cur.getAttribute("src") === src) return rest();
      const next = imgs[1 - front]!;
      const reveal = () => {
        if (key !== k) return; // the visitor has moved on
        next.setAttribute("data-on", "");
        cur.removeAttribute("data-on");
        front = 1 - front;
        rest();
      };
      // Only the load event: while a new src is pending, `complete` and
      // `naturalWidth` still describe the previous image.
      next.onload = reveal;
      next.setAttribute("src", src);
    };

    /* True when [from, to] is already downloaded. */
    const buffered = (from: number, to: number) => {
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= from + 0.1 && video.buffered.end(i) >= to - 0.1) return true;
      }
      return false;
    };

    const hideVideo = () => {
      layer.removeAttribute("data-video");
      rest();
    };
    const showVideo = () => {
      layer.setAttribute("data-video", "");
      rest();
    };

    /* Watch playback until the target keyframe, then hold on it exactly. */
    const watch = () => {
      raf = 0;
      const target = key * FILM_SECONDS_PER_STAGE;
      if (video.currentTime >= target - 0.02 || video.ended) {
        video.pause();
        if (Math.abs(video.currentTime - target) > 0.04) video.currentTime = target;
        rest();
        return;
      }
      if (video.readyState < 3) {
        // Ran out of downloaded film mid-transition: finish on the still instead.
        video.pause();
        hideVideo();
        video.currentTime = target;
        return;
      }
      const behind = (target - video.currentTime) / FILM_SECONDS_PER_STAGE;
      video.playbackRate = Math.min(MAX_RATE, BASE_RATE * Math.max(1, behind));
      raf = requestAnimationFrame(watch);
    };

    /* Park the film on a keyframe and show it once that frame is decoded. */
    const settleOn = (k: number) => {
      video.pause();
      hideVideo();
      video.currentTime = k * FILM_SECONDS_PER_STAGE;
      video.addEventListener("seeked", () => key === k && video.readyState >= 2 && showVideo(), { once: true });
    };

    const goTo = (k: number) => {
      if (k === key) return;
      const from = video.currentTime;
      const back = k < key;
      key = k;
      showStill(k);
      if (!filmOn || !ready) return;
      cancelAnimationFrame(raf);
      const target = k * FILM_SECONDS_PER_STAGE;
      if (back || from > target) return settleOn(k);
      if (!layer.hasAttribute("data-video") || !buffered(from, target)) return settleOn(k);
      water?.hide(true);
      video.play().then(() => (raf = requestAnimationFrame(watch)), () => settleOn(k));
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
      if (visible !== onScreen) {
        onScreen = visible;
        rest();
      }
      // The instrument strip sits on the bottom edge: it reads light only while the film is behind it.
      root.toggleAttribute("data-film", visible && last.bottom > vh - 64);

      let current = list[0]!;
      for (const s of list) if (s.getBoundingClientRect().top <= vh * LINE) current = s;
      goTo(Number(current.dataset.filmKey));
    };

    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(measure);
    };

    // Stills first, then the film: on a slow link the video would otherwise
    // take all the bandwidth and the chapter stills would arrive late.
    // One at a time, in chapter order, so the next chapter's still is never
    // sharing a slow link with six others.
    let disposed = false;
    const stillsLoaded = (async () => {
      for (let k = 0; k < 7 && !disposed; k++) {
        const im = new Image();
        im.src = still(k);
        await im.decode().catch(() => undefined);
      }
    })();
    if (filmOn) {
      void stillsLoaded.then(() => {
        if (disposed) return;
        video.src = window.innerWidth < 820 || slowLink ? "/journey/film-720.mp4" : "/journey/film-1080.mp4";
        video.addEventListener(
          "loadeddata",
          () => {
            ready = true;
            settleOn(Math.max(0, key));
          },
          { once: true },
        );
      });
    }

    video.addEventListener("seeked", rest);
    // The opening still may still be arriving when the page hydrates.
    if (!imgs[0]!.complete) imgs[0]!.addEventListener("load", rest, { once: true });
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(queued);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.removeEventListener("seeked", rest);
      video.pause();
      water?.dispose();
      root.removeAttribute("data-film");
    };
  }, []);

  return (
    <div ref={layerRef} className={styles.film} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- crossfaded by script per chapter; next/image would fight that */}
      <img ref={imgARef} src={still(0)} alt="" className={styles.still} data-on="" fetchPriority="high" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- second crossfade layer */}
      <img ref={imgBRef} alt="" className={styles.still} decoding="async" />
      <video ref={videoRef} className={styles.video} muted playsInline preload="auto" disablePictureInPicture />
      <canvas ref={waterRef} className={styles.water} />
      <div className={styles.grade} />
    </div>
  );
}
