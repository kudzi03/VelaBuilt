"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { capabilityStore } from "@/lib/capability";
import { signal } from "@/lib/signal";
import { SignalFallback } from "./SignalFallback";

/**
 * The world, on a page that is read rather than travelled.
 *
 * Inner pages get the same scene as the homepage — the same corridor, the
 * same gates, the same light — parked at one point on the path instead of
 * scrolled through it. The camera breathes: a slow, shallow drift around the
 * parked position, because a still frame of a three-dimensional space reads
 * as a photograph of one, and the whole argument of this site is that the
 * system is running.
 *
 * `parked` chooses which stage of the system a page sits inside, so /start
 * waits at the gate where an inquiry arrives and the case study sits at the
 * end where a person decides. Same world, different seat.
 *
 * The drawn SVG is still here, and still exactly what a visitor gets with
 * reduced motion, without WebGL, on a low-power device or with data saver
 * on. It is a fallback, not the default.
 */

const SignalScene = dynamic(
  () => import("./SignalScene").then((m) => m.SignalScene),
  { ssr: false },
);

export function SignalStill({
  parked = 0.5,
  drift = true,
}: {
  /** Where on the path this page sits, 0..1. */
  readonly parked?: number;
  /** Whether the camera breathes. Ignored under reduced motion. */
  readonly drift?: boolean;
}) {
  const capability = useSyncExternalStore(
    capabilityStore.subscribe,
    capabilityStore.getSnapshot,
    capabilityStore.getServerSnapshot,
  );

  const [idleReached, setIdleReached] = useState(false);

  useEffect(() => {
    signal.reducedMotion = capability.reducedMotion;
  }, [capability.reducedMotion]);

  useEffect(() => {
    if (!capability.webgl || capability.tier === "C") return;

    const start = () => setIdleReached(true);
    const idleApi = window as Window &
      Partial<Pick<Window, "requestIdleCallback" | "cancelIdleCallback">>;

    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const handle = idleApi.requestIdleCallback(start, { timeout: 2500 });
      return () => idleApi.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(start, 900);
    return () => window.clearTimeout(timer);
  }, [capability.webgl, capability.tier]);

  const wantsScene =
    idleReached && capability.webgl && capability.tier !== "C" && !capability.reducedMotion;

  // Park the camera, then breathe. The drift is ±1.2% of the path — far too
  // small to read as travel, large enough that the frame is alive.
  useEffect(() => {
    signal.progress = parked;
    signal.visible = wantsScene;
    if (!wantsScene) return;

    if (!drift || signal.reducedMotion) {
      signal.wake?.();
      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const seconds = (now - started) / 1000;
      signal.progress = parked + Math.sin(seconds * 0.16) * 0.012;
      signal.wake?.();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      signal.visible = false;
    };
  }, [parked, drift, wantsScene]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-tier={capability.tier}
      data-signal={wantsScene ? "scene" : "drawn"}
    >
      <div className="signal-ground absolute inset-0" />

      <div
        className="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ opacity: wantsScene ? 0 : 1 }}
      >
        <SignalFallback />
      </div>

      {wantsScene ? <SignalScene tier={capability.tier === "A" ? "A" : "B"} /> : null}

      <div aria-hidden="true" className="signal-scrim absolute inset-0" />
    </div>
  );
}
