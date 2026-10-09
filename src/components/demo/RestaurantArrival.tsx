"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./RestaurantDemo.module.css";

/** Footage is requested only after the visitor chooses to enter. */
export function RestaurantArrival({ reserve, bookingOpen }: { reserve: () => void; bookingOpen: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const scene = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  async function play() {
    const el = video.current;
    if (!el) return;
    if (!started || failed) { el.src = "/demo/ember/walkthrough.mp4"; setStarted(true); }
    if (ended) { el.currentTime = 0; setEnded(false); }
    setFailed(false);
    try { await el.play(); } catch { setPlaying(false); setFailed(true); }
  }

  useEffect(() => {
    const el = video.current;
    const section = scene.current;
    if (!el || !section) return;
    const hide = () => { if (document.hidden) el.pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) el.pause(); });
    observer.observe(section);
    document.addEventListener("visibilitychange", hide);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => { if (bookingOpen) video.current?.pause(); }, [bookingOpen]);

  return <section ref={scene} className={`${styles.hero} ${styles.arrival}`} data-entered={ready} data-playing={playing} data-ended={ended} aria-labelledby="restaurant-title">
    <div className={styles.arrivalMedia}>
      <Image src="/demo/ember/interior.webp" alt="Warmly lit restaurant interior with linen tables, arched windows and an open hearth; original concept imagery" fill sizes="(max-width: 800px) 1200px, 100vw" priority />
      <video ref={video} className={styles.walkthrough} data-ready={ready} muted playsInline preload="none" aria-hidden="true"
        onPlaying={() => { setReady(true); setPlaying(true); setFailed(false); }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setEnded(true); setPlaying(false); setProgress(1); }}
        onError={() => { setFailed(true); setPlaying(false); setReady(false); }}
        onTimeUpdate={() => { const el = video.current; if (el?.duration) setProgress(el.currentTime / el.duration); }} />
    </div>
    <nav className={styles.nav} aria-label="Restaurant concept">
      <a href="#restaurant-title" className={styles.brand}>e<span>&</span>g<span className={styles.brandLine}>Ember & Grain</span></a>
      <div><a href="#story">Our table</a><a href="#menu">The menu</a><button onClick={reserve} className={styles.navBook}>Find a table <span aria-hidden="true">↗</span></button></div>
    </nav>
    <div className={styles.heroWords}><p className={styles.eyebrow}>A little fire. A lot of heart.</p><h1 id="restaurant-title"><span>EMBER</span><span><i>&</i> GRAIN</span></h1></div>
    <div className={styles.welcome} aria-hidden="true"><span>Leave the rush outside.</span><em>Stay a little longer.</em></div>
    <div className={styles.heroBottom}>
      <div className={styles.arrivalCaption}><p>{!ready ? <>Food with a sense of place.<br />Your evening starts at the door.</> : ended ? <>You’re here.<br />Make yourself at home.</> : progress < .45 ? <>Through the doorway.<br />Into the evening.</> : <>A table. A little fire.<br />Room to stay awhile.</>}</p><span className={styles.shotProgress} style={{ "--progress": progress } as CSSProperties} aria-hidden="true" /></div>
      <div className={styles.arrivalControls}>
        <button className={styles.enterButton} onClick={() => playing ? video.current?.pause() : void play()} aria-label={playing ? "Pause walkthrough" : ended ? "Replay walkthrough" : started && ready ? "Continue walkthrough" : "Step inside the restaurant"}>
          <span>{playing ? "Pause the moment" : ended ? "Walk in again" : started && ready ? "Keep exploring" : started && !failed ? "Opening the door…" : "Step inside"}</span><span aria-hidden="true">{playing ? "Ⅱ" : "↗"}</span>
        </button>
        <a href="#menu">{ended ? "Now, something delicious" : "Straight to the menu"} <span aria-hidden="true">↓</span></a>
      </div>
      <span className={styles.heroNote}>Seasonal kitchen<br />An original VelaBuilt concept</span>
    </div>
    {failed && <p role="status" className={styles.mediaError}>The walkthrough couldn’t load. You can still explore the menu and try a reservation below.</p>}
  </section>;
}
