"use client";

import { useEffect } from "react";
import { GATES } from "@/content/signal-path";
import { clamp01, nearestGate, setGate, signal } from "@/lib/signal";

/**
 * The only place scroll is read.
 *
 * ScrollTrigger maps the journey container to 0..1 and scrubs it, which is
 * what buys the cinematic part: the camera has weight, it lags the wheel
 * slightly, and it lands rather than snapping. Native scroll is untouched —
 * no hijacking, no virtual scroller, no stolen keyboard or trackpad
 * behaviour. The visitor's wheel still does exactly what it does everywhere
 * else; the camera simply follows where they already are.
 *
 * Nothing here calls setState. The renderer reads `signal` every frame, and
 * only a change of gate — a few times per page — reaches React.
 */
export function SignalDriver({ targetId }: { readonly targetId: string }) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    signal.reducedMotion = motionQuery.matches;
    const onMotionChange = () => {
      signal.reducedMotion = motionQuery.matches;
    };
    motionQuery.addEventListener("change", onMotionChange);

    let cancelled = false;
    let teardown: (() => void) | undefined;

    // GSAP is only needed once the page is interactive, and only by visitors
    // who actually reach the journey. Loading it with the route would put a
    // scroll library in front of the first paint.
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const state = { progress: 0 };
      let previous = 0;
      let lastAt = performance.now();

      const trigger = ScrollTrigger.create({
        trigger: target,
        start: "top top",
        end: "bottom bottom",
        // A reduced-motion visitor gets position without inertia: the scene
        // still follows the page, it simply never drifts on its own.
        scrub: signal.reducedMotion ? true : 0.75,
        onUpdate: (self) => {
          state.progress = clamp01(self.progress);
        },
        onToggle: (self) => {
          signal.visible = self.isActive;
        },
      });

      // ScrollTrigger writes the target value; this loop publishes it with a
      // velocity, so the scene can react to how hard the visitor is moving.
      const tick = () => {
        if (cancelled) return;
        const now = performance.now();
        const delta = Math.max(0.001, (now - lastAt) / 1000);
        lastAt = now;

        signal.progress = state.progress;
        signal.velocity = (state.progress - previous) / delta;
        previous = state.progress;

        setGate(nearestGate(state.progress, GATES.length));

        // On-demand rendering: the scene draws nothing until it is told the
        // world changed.
        if (signal.visible) signal.wake?.();
      };
      gsap.ticker.add(tick);

      // The run is on screen at mount if the page was restored mid-scroll.
      signal.visible = trigger.isActive;

      teardown = () => {
        gsap.ticker.remove(tick);
        trigger.kill();
      };
    })();

    return () => {
      cancelled = true;
      motionQuery.removeEventListener("change", onMotionChange);
      signal.visible = false;
      teardown?.();
    };
  }, [targetId]);

  return null;
}
