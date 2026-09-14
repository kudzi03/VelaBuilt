"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { capabilityStore } from "@/lib/capability";
import { journey, subscribeToChapter, CHAPTERS } from "@/lib/journey";
import { SCENES } from "@/content/scenes";
import { JourneyDriver } from "./JourneyDriver";
import { CssPlate } from "./plate/CssPlate";

/**
 * The backdrop for the cinematic run.
 *
 *   1. The server renders the opening plate. It is in the first paint, so the
 *      page is never blank and the hero's text never waits on a canvas.
 *   2. After hydration the capability store reports the device's real tier.
 *   3. On a capable device the compositor mounts behind the content at idle
 *      and takes the camera over.
 *
 * The semantic content above this is identical in every tier. Upgrading swaps
 * only the layer behind it, which is why it costs no layout shift and never
 * moves a word of text.
 */

const PlateCanvas = dynamic(
  () => import("./plate/PlateCanvas").then((mod) => mod.PlateCanvas),
  { ssr: false },
);

const OPENING = SCENES[0]!;

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

  const showCanvas = idleReached && capability.webgl && capability.tier !== "C";

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-tier={capability.tier}
    >
<div className="stage-layer">
        {/* Always present: the opening plate, server-rendered. The compositor
            draws over it once it is running. */}
        <CssPlate
          plate={OPENING.plate}
          alt={OPENING.alt}
          priority
          focal={OPENING.focal}
          portraitFocal={OPENING.portraitFocal}
          dim={showCanvas ? 0 : 1}
        />

        {/* Tier C still travels the building — it just does it in stills. */}
        {!showCanvas ? <PlateSequence /> : null}

        {showCanvas ? (
          <div className="absolute inset-0">
            <PlateCanvas tier={capability.tier === "A" ? "A" : "B"} />
          </div>
        ) : null}
      </div>

      {/* Keeps text legible over whichever world is behind it. Photographic
          plates are brighter and busier than the gradients they replaced, so
          the shield does more work here than it used to. */}
      <div
        aria-hidden="true"
        // In portrait the copy sits below the band on solid ground, so the
        // shield only has to protect the band itself.
        className="stage-scrim absolute inset-0"
        style={{
          background: [
            "linear-gradient(180deg, rgb(5 5 6 / 0.2) 0%, transparent 26%, transparent 62%, rgb(5 5 6 / 0.55) 100%)",
            "linear-gradient(90deg, rgb(5 5 6 / 0.52) 0%, rgb(5 5 6 / 0.16) 46%, transparent 78%, rgb(5 5 6 / 0.22) 100%)",
          ].join(", "),
        }}
      />

      <JourneyDriver targetId={targetId} />
    </div>
  );
}

/**
 * The journey for devices that get no canvas: the same rooms, crossfading as
 * the reader moves between chapters. Plates load as they are approached, so a
 * visitor who stops at the hero downloads exactly one.
 */
function PlateSequence() {
  const [chapter, setChapter] = useState(0);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    return subscribeToChapter((next) => {
      setChapter(next);
      setReached((high) => Math.max(high, next));
    });
  }, []);

  return (
    <>
      {SCENES.map((scene, index) => {
        // Skip the opening plate: it is already rendered by the stage.
        if (index === 0) return null;
        if (index > reached + 1) return null;

        const current = index === chapter;

        return (
          <div
            key={CHAPTERS[index]!.id}
            // Every plate keeps its description; plates that are faded out are
            // hidden from assistive technology instead, so only the room on
            // screen is announced. Blanking the alt to "" said the image was
            // decorative, which it is not.
            aria-hidden={current ? undefined : true}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ opacity: current ? 1 : 0 }}
          >
            <CssPlate
              plate={scene.plate}
              alt={scene.alt}
              focal={scene.focal}
              portraitFocal={scene.portraitFocal}
            />
          </div>
        );
      })}
    </>
  );
}
