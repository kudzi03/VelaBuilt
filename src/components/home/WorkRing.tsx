"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { workCategories, type WorkItem } from "@/content/work";
import { ArrowRight } from "@/components/ui/Primitives";
import { Scene } from "./Scene";
import styles from "./WorkRing.module.css";

/**
 * OUR WORK — every piece standing in a slow ring on the night pan.
 *
 * The ring turns to the next piece every few seconds while it is on screen
 * and nobody is touching it. Drag, swipe, the arrows or Tab bring any piece
 * to the front; the card below names the one in front, with its honest
 * category. The markup is a plain list of links: without JavaScript, or with
 * reduced motion, it is a row you scroll sideways.
 */

const IMAGES: Record<string, string> = {
  "kingson-engineering": "/work/kingson-engineering/desktop.webp",
  "cardio-life": "/work/cardio-life/desktop.webp",
  "ember-and-grain": "/demo/ember/interior.webp",
};

/** The working examples and concepts have no screenshot: a plain sketch of what each one does. */
const SKETCHES: Record<string, ReactNode> = {
  "follow-up-recovery-demo": (
    <ol className={styles.sketch}>
      <li>Enquiry recorded</li>
      <li>Reply sent</li>
      <li>Follow-up scheduled</li>
      <li>Passed to a person</li>
    </ol>
  ),
  "system-lab-demo": (
    <ol className={`${styles.sketch} ${styles.chain}`}>
      <li>Customer details</li>
      <li>Follow-up</li>
      <li>Booking</li>
    </ol>
  ),
  "discoverability-concept": (
    <ol className={styles.sketch}>
      <li>Services</li>
      <li>Area served</li>
      <li>Opening hours</li>
      <li>The same facts everywhere</li>
    </ol>
  ),
};

const AUTO_MS = 5000;
const label = (item: WorkItem) => workCategories.find((c) => c.id === item.category)!.label;

export function WorkRing({ items }: { readonly items: readonly WorkItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLUListElement>(null);
  const [front, setFront] = useState(0);
  const goRef = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = stageRef.current!;
    const list = ringRef.current!;
    const panels = [...list.children] as HTMLElement[];
    const n = panels.length;
    const step = 360 / n;
    let angle = 0, target = 0, raf = 0, onScreen = false, dragging = false, moved = 0, lastX = 0, vel = 0;
    let idleUntil = performance.now() + AUTO_MS, hovering = false, current = 0;

    const frontOf = (a: number) => (((Math.round(-a / step)) % n) + n) % n;
    const layout = () => {
      const r = panels[0]!.offsetWidth * 1.02;
      list.style.transform = `translateZ(${-r}px) rotateY(${angle}deg)`;
      panels.forEach((p, i) => {
        p.style.transform = `rotateY(${i * step}deg) translateZ(${r}px)`;
        const facing = Math.cos(((i * step + angle) * Math.PI) / 180);
        // Pictures on panels turned aside dim; a panel facing away is not
        // painted (backface hidden), so its face fades out entirely. It stays
        // focusable: Tab brings it round to the front.
        p.style.setProperty("--shade", String(Math.min(0.55, 1 - Math.max(0, facing))));
        p.style.setProperty("--face", facing > 0.05 ? "1" : "0");
      });
      const f = frontOf(angle);
      if (f !== current) setFront((current = f));
    };
    const tick = (now: number) => {
      raf = 0;
      if (!dragging && !hovering && now > idleUntil) {
        target -= step;
        idleUntil = now + AUTO_MS;
      }
      if (!dragging) angle += (target - angle) * 0.07;
      layout();
      if (onScreen) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (onScreen && !raf) raf = requestAnimationFrame(tick);
    };
    /** Bring piece i to the front by the shortest way round. */
    goRef.current = (i: number) => {
      const here = frontOf(target);
      let d = (i - here) % n;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      target = Math.round(target / step) * step - d * step;
      idleUntil = performance.now() + AUTO_MS * 2;
      wake();
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      vel = 0;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = (e.clientX - lastX) * 0.22;
      lastX = e.clientX;
      moved += Math.abs(dx);
      angle += dx;
      target = angle;
      vel = dx;
      if (moved > 3) stage.setAttribute("data-dragging", "");
      wake();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      stage.removeAttribute("data-dragging");
      target = Math.round((angle + vel * 8) / step) * step;
      idleUntil = performance.now() + AUTO_MS * 2;
      wake();
    };
    // A drag is not a click on the panel under the pointer.
    const click = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const focus = (e: FocusEvent) => {
      const i = panels.findIndex((p) => p.contains(e.target as Node));
      if (i >= 0) goRef.current(i);
    };
    // Never turn while the visitor is scrolling past.
    const scrolled = () => (idleUntil = performance.now() + AUTO_MS);
    const enter = () => (hovering = true);
    const leave = () => {
      hovering = false;
      idleUntil = performance.now() + AUTO_MS;
      up();
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = !!e?.isIntersecting;
      if (onScreen) {
        idleUntil = performance.now() + AUTO_MS;
        wake();
      }
    });
    io.observe(stage);
    stage.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    stage.addEventListener("click", click, true);
    stage.addEventListener("focusin", focus);
    stage.addEventListener("pointerenter", enter);
    stage.addEventListener("pointerleave", leave);
    window.addEventListener("resize", layout);
    window.addEventListener("scroll", scrolled, { passive: true });
    // Set on the element, not in state: the ring is presentation, not content.
    rootRef.current!.setAttribute("data-ring", "");
    layout();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      stage.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      stage.removeEventListener("click", click, true);
      stage.removeEventListener("focusin", focus);
      stage.removeEventListener("pointerenter", enter);
      stage.removeEventListener("pointerleave", leave);
      window.removeEventListener("resize", layout);
      window.removeEventListener("scroll", scrolled);
    };
  }, []);

  const item = items[front]!;

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={stageRef} className={styles.stage}>
        <Scene frame={5} />
        <ul ref={ringRef} className={styles.ring}>
          {items.map((w, i) => {
            const face = (
              <>
                <span className={styles.media}>
                  {IMAGES[w.slug] ? (
                    <Image src={IMAGES[w.slug]!} alt="" fill sizes="18rem" className={styles.shot} draggable={false} />
                  ) : (
                    SKETCHES[w.slug]
                  )}
                </span>
                <span className={styles.cap}>
                  <span className="label label-champagne">{label(w)}</span>
                  <span className="display-sm">{w.title}</span>
                  <span className={styles.flatText}>{w.response}</span>
                </span>
              </>
            );
            return (
              <li key={w.slug} className={styles.panel} data-front={i === front || undefined}>
                {w.href ? (
                  <Link href={w.href} className={styles.face} draggable={false}>
                    {face}
                  </Link>
                ) : (
                  <div className={styles.face} tabIndex={0} aria-label={`${w.title}, ${label(w)}`}>
                    {face}
                  </div>
                )}
                <span className={styles.back} aria-hidden="true" />
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.detail}>
        <div className={styles.nav}>
          <button type="button" className={styles.round} aria-label="Previous piece" onClick={() => goRef.current(front - 1)}>
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className={styles.round} aria-label="Next piece" onClick={() => goRef.current(front + 1)}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className={styles.text}>
          <p className="label label-champagne">
            {label(item)}
            {item.context ? <span className="text-[color:var(--color-muted)]"> · {item.context}</span> : null}
          </p>
          <h3 className="display-md mt-3">{item.title}</h3>
          <p className="mt-3 max-w-[60ch] leading-relaxed">{item.response}</p>
          {item.priorToStudio ? (
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Delivered by the founder before the VelaBuilt studio identity existed.
            </p>
          ) : null}
        </div>
        <div className={styles.actions}>
          {item.href ? (
            <Link href={item.href} className="btn btn-primary">
              <span>{item.linkLabel ?? "Open the demonstration"}</span>
              <ArrowRight />
            </Link>
          ) : null}
          {item.liveUrl ? (
            <a href={item.liveUrl} className="btn" target="_blank" rel="noopener noreferrer">
              <span>Visit the live site</span>
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
