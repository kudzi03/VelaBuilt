"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { capabilityStore } from "@/lib/capability";
import { signal } from "@/lib/signal";
import { SignalDriver } from "./SignalDriver";
import { SignalFallback } from "./SignalFallback";

/**
 * The world behind the page.
 *
 *   1. The server renders the drawn fallback. It is in the first paint, so
 *      the hero's type never waits on a renderer and the page is never blank.
 *   2. After hydration the capability store reports the device's real tier.
 *   3. On a capable device the scene mounts at idle, behind the content, and
 *      the fallback crossfades out only once the scene has actually drawn.
 *
 * The DOM above this is identical in every tier: every gate's name and
 * meaning is real text in the page. Upgrading swaps the layer behind the
 * words and nothing else, which is why it costs no layout shift and cannot
 * change what a screen reader hears.
 */

const SignalScene = dynamic(
  () => import("./SignalScene").then((m) => m.SignalScene),
  { ssr: false },
);

export function SignalStage({ targetId }: { readonly targetId: string }) {
  const capability = useSyncExternalStore(
    capabilityStore.subscribe,
    capabilityStore.getSnapshot,
    capabilityStore.getServerSnapshot,
  );

  const [idleReached, setIdleReached] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);

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

  // Reduced motion keeps the drawn version: the scene's whole point is
  // movement, and a still frame of it says less than the diagram does.
  const wantsScene =
    idleReached &&
    !sceneFailed &&
    capability.webgl &&
    capability.tier !== "C" &&
    !capability.reducedMotion;

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-tier={capability.tier}
      data-signal={wantsScene ? "scene" : "drawn"}
    >
      <div className="signal-ground absolute inset-0" />

      {/* Always present, always first. */}
      <div
        className="absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ opacity: wantsScene ? 0 : 1 }}
      >
        <SignalFallback />
      </div>

      {wantsScene ? (
        <ErrorBoundaryish onFailure={() => setSceneFailed(true)}>
          <SignalScene tier={capability.tier === "A" ? "A" : "B"} />
        </ErrorBoundaryish>
      ) : null}

      {/* Keeps type legible over whatever is behind it. The scene is far
          darker than the photographic plates were, so this does less work
          than its predecessor — but the contrast rig, not taste, decides. */}
      <div aria-hidden="true" className="signal-scrim absolute inset-0" />

      <SignalDriver targetId={targetId} />
    </div>
  );
}

/**
 * A WebGL context can be refused after the capability probe passed — a
 * blocklisted driver, a lost context that never restores. If that happens the
 * drawn version comes back rather than the page going dark.
 */
function ErrorBoundaryish({
  children,
  onFailure,
}: {
  readonly children: React.ReactNode;
  readonly onFailure: () => void;
}) {
  useEffect(() => {
    const onContextFailure = (event: Event) => {
      if ((event as CustomEvent).type === "webglcontextcreationerror") onFailure();
    };
    window.addEventListener("webglcontextcreationerror", onContextFailure, true);
    return () =>
      window.removeEventListener("webglcontextcreationerror", onContextFailure, true);
  }, [onFailure]);

  return <>{children}</>;
}
