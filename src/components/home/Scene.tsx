"use client";

import { useEffect, useRef } from "react";
import { createWater } from "./water";
import styles from "./Scene.module.css";

/**
 * A film keyframe used as a place: the still, alive with the water shader
 * while it is on screen. The stills are the same files the homepage film
 * preloads, so a scene costs no extra download. Decorative.
 */
export function Scene({ frame, fade = false, className = "" }: { readonly frame: number; readonly fade?: boolean; readonly className?: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const img = imgRef.current!;
    const water = createWater(canvasRef.current!);
    if (!water) return;
    let onScreen = false;
    const show = () => onScreen && img.complete && img.naturalWidth && water.show(img, frame);
    img.addEventListener("load", show);
    const io = new IntersectionObserver(([e]) => {
      onScreen = !!e?.isIntersecting;
      if (onScreen) show();
      else water.hide();
    });
    io.observe(img);
    return () => {
      io.disconnect();
      img.removeEventListener("load", show);
      water.dispose();
    };
  }, [frame]);

  return (
    <div className={`${styles.scene} ${fade ? styles.fade : ""} ${className}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- the same file the film preloads; the shader samples it */}
      <img ref={imgRef} src={`/journey/k${frame}.webp`} alt="" loading="lazy" decoding="async" />
      <canvas ref={canvasRef} />
    </div>
  );
}
