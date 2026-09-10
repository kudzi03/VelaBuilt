"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { capabilityStore } from "@/lib/capability";
import { journey } from "@/lib/journey";
import { JourneyDriver } from "./JourneyDriver";
import { StaticWorld } from "./StaticWorld";

/**
 * The backdrop for the cinematic run.
 *
 * Order of events, and the reason for it:
 *   1. The server renders the CSS world. It is in the first paint, so the page
 *      is never blank and the hero's text never waits on a canvas.
 *   2. After hydration, the capability store reports the device's real tier.
 *   3. On a capable device, the 3D corridor is imported and mounted behind the
 *      content — after the browser has gone idle, so it never competes with
 *      LCP or first input.
 *
 * The semantic content above this is identical in every tier. Upgrading swaps
 * only the layer behind it, which is why the upgrade costs no layout shift and
 * never moves a word of text.
 */

const WorldCanvas = dynamic(
  () => import("./WorldCanvas").then((mod) => mod.WorldCanvas),
  { ssr: false },
);

export function CinematicStage({ targetId }: { readonly targetId: string }) {
  const capability = useSyncExternalStore(
    capabilityStore.subscribe,
    capabilityStore.getSnapshot,
    capabilityStore.getServerSnapshot,
  );

  const [idleReached, setIdleReached] = useState(false);

  useEffect(() => {
    journey.reducedMotion = capability.reducedMotion;
  }, [capability.reducedMotion]);

  useEffect(() => {
    if (!capability.webgl) return;

    // Wait for idle: the corridor is decoration and must never delay content.
    const start = () => setIdleReached(true);
    const idleApi = window as Window &
      Partial<Pick<Window, "requestIdleCallback" | "cancelIdleCallback">>;

    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const handle = idleApi.requestIdleCallback(start, { timeout: 2500 });
      return () => idleApi.cancelIdleCallback?.(handle);
    }

    const timer = window.setTimeout(start, 900);
    return () => window.clearTimeout(timer);
  }, [capability.webgl]);

  const showWorld = idleReached && capability.webgl && capability.tier !== "C";

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-tier={capability.tier}
    >
      {/* Always present. The 3D layer sits on top of it when it exists. */}
      {/* Sits lower and reads fully when it *is* the experience; higher and
          dimmer when it is only the ground beneath the corridor. */}
      <StaticWorld
        horizon={showWorld ? 0.56 : 0.64}
        intensity={showWorld ? 0.5 : 1}
      />

      {showWorld ? (
        <div className="absolute inset-0">
          <WorldCanvas tier={capability.tier === "A" ? "A" : "B"} />
        </div>
      ) : null}

      {/* Keeps text legible over whichever world is behind it.
          Two gradients, because the corridor is bright in two places: along
          the left, where the copy sits, and across the lit floor at the foot
          of the frame, where a section's last lines would otherwise sit on
          champagne. Neither is heavy enough to flatten the world. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(180deg, rgb(5 5 6 / 0.35) 0%, rgb(5 5 6 / 0.05) 34%, rgb(5 5 6 / 0.28) 72%, rgb(5 5 6 / 0.62) 100%)",
            "linear-gradient(90deg, rgb(5 5 6 / 0.66) 0%, rgb(5 5 6 / 0.3) 42%, rgb(5 5 6 / 0.18) 74%, rgb(5 5 6 / 0.44) 100%)",
          ].join(", "),
        }}
      />

      <JourneyDriver targetId={targetId} />
    </div>
  );
}
