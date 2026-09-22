"use client";

/**
 * THE DOOR, AND EVERYTHING AROUND THE EDGE OF THE FRAME.
 *
 * Three jobs, in order of how much they matter:
 *
 *   1. Never trap anybody. "Standard view" is on screen from the first frame
 *      and at every moment after it. The conventional page is not hidden
 *      behind the world — it is underneath it, in the DOM, always rendered.
 *      Dismissing the world reveals a page that was there the whole time.
 *
 *   2. Never lie about loading. The bar reflects real progress through real
 *      work. When the work finishes in 200 ms the bar is not stretched out to
 *      look impressive; the door just opens.
 *
 *   3. Never take something the visitor has not offered. No pointer lock on
 *      load. No microphone on load. No sound on load. Each is a deliberate
 *      act with an obvious way back out.
 *
 * ── ON THE VOICE CHOICE ──────────────────────────────────────────────────
 *
 * The guide is offered once, at the threshold, as two equal options. Not a
 * pre-ticked box, not a bubble that starts talking. "Explore silently" is
 * listed first-equal and styled the same, because a visitor who wants quiet
 * should not have to decline anything.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { capabilityStore } from "@/lib/capability";
import { coarsePointerStore } from "@/world/pointer";
import { HALLS, HALL_BY_ID, ROUTE, type HallId } from "@/world/facility";
import type { TouchStick } from "@/world/input";
import type { WorldHandle } from "./WorldCanvas";
import { setAudio, setEntered, subscribe, worldContext } from "@/world/state";
import { WorldBoundary } from "./WorldBoundary";

const WorldCanvas = dynamic(() => import("./WorldCanvas").then((m) => m.WorldCanvas), {
  ssr: false,
});

type Phase = "closed" | "loading" | "threshold" | "open";

export function WorldStage() {
  /**
   * Both of these are facts about the device, not application state, so they
   * are read through useSyncExternalStore rather than probed in an effect.
   * The server snapshot is the conservative one — no WebGL, fine pointer —
   * so the markup React sends and the markup it hydrates always agree, and
   * the door does not flicker into existence after hydration.
   */
  const capability = useSyncExternalStore(
    capabilityStore.subscribe,
    capabilityStore.getSnapshot,
    capabilityStore.getServerSnapshot,
  );
  const touch = useSyncExternalStore(
    coarsePointerStore.subscribe,
    coarsePointerStore.getSnapshot,
    coarsePointerStore.getServerSnapshot,
  );
  const [phase, setPhase] = useState<Phase>("closed");
  const [progress, setProgress] = useState(0);
  const [locked, setLocked] = useState(false);
  const [stick, setStick] = useState<TouchStick>({ origin: null, point: null });
  const [hall, setHall] = useState<HallId | null>(null);
  const handle = useRef<WorldHandle | null>(null);

  useEffect(() => subscribe("hall", () => setHall(worldContext.hall)), []);

  // The world owns the document while it is open: the page behind must not
  // scroll under it, and it must be inert to assistive technology so a screen
  // reader does not read a page the visitor cannot see.
  useEffect(() => {
    const open = phase !== "closed";
    document.documentElement.classList.toggle("world-open", open);
    return () => document.documentElement.classList.remove("world-open");
  }, [phase]);

  const enter = useCallback(() => {
    setPhase("loading");
    setProgress(0.04);
  }, []);

  const onReady = useCallback(() => {
    setProgress(1);
    // One beat at full so the bar is seen to complete rather than vanishing
    // mid-travel, which reads as a crash.
    window.setTimeout(() => setPhase("threshold"), 260);
  }, []);

  const begin = useCallback(
    (voice: boolean) => {
      setAudio({ voice, muted: !voice });
      setEntered(true);
      setPhase("open");
      if (!touch) handle.current?.requestLook();
    },
    [touch],
  );

  const leave = useCallback(() => {
    setPhase("closed");
    setEntered(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (phase === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      // Escape releases pointer lock first (the browser does that itself);
      // a second Escape leaves the world. One key, two steps, no trap.
      if (e.key === "Escape" && !locked && phase === "open") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, locked, leave]);

  const goToHall = useCallback((id: HallId) => {
    const h = HALL_BY_ID[id];
    handle.current?.goTo(h.entry[0], h.entry[1], 0);
  }, []);

  const current = hall ? HALL_BY_ID[hall] : null;

  /* ── the invitation, on the page ─────────────────────────────────────── */

  if (phase === "closed") {
    return (
      <EnterButton
        onEnter={enter}
        // Tier C never offers the door. A device that cannot run the world is
        // shown the conventional site and told nothing about what it missed.
        available={capability.webgl && capability.tier !== "C"}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-[var(--color-void)]"
      role="region"
      aria-label="The VelaBuilt facility, an interactive environment"
    >
      <WorldBoundary onFailure={leave}>
        <WorldCanvas
          capability={capability}
          onReady={onReady}
          onLockChange={setLocked}
          onStick={setStick}
          handleRef={handle}
        />
      </WorldBoundary>

      {(phase === "loading" || phase === "threshold") && (
        <Threshold
          phase={phase}
          progress={progress}
          onBegin={begin}
          onLeave={leave}
        />
      )}

      {phase === "open" && (
        <Hud
          hall={current}
          locked={locked}
          touch={touch}
          onLeave={leave}
          onLook={() => handle.current?.requestLook()}
          onGoTo={goToHall}
        />
      )}

      {phase === "open" && touch && <TouchLayer stick={stick} />}
    </div>
  );
}

/* ── the invitation ─────────────────────────────────────────────────────── */

function EnterButton({ onEnter, available }: { onEnter: () => void; available: boolean }) {
  if (!available) return null;
  return (
    <button
      type="button"
      onClick={onEnter}
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 rounded-full border border-[var(--color-hairline-strong)] bg-[rgb(8_8_10/0.82)] px-6 py-3 text-[0.8rem] tracking-[0.14em] text-[var(--color-ivory)] uppercase backdrop-blur-md transition-colors hover:border-[var(--color-champagne)] hover:text-[var(--color-champagne-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
    >
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-champagne)] align-middle" />
      Enter the facility
    </button>
  );
}

/* ── loading, then the threshold ────────────────────────────────────────── */

function Threshold({
  phase,
  progress,
  onBegin,
  onLeave,
}: {
  phase: Phase;
  progress: number;
  onBegin: (voice: boolean) => void;
  onLeave: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[rgb(5_5_6/0.94)] px-6 text-center backdrop-blur-xl">
      <p className="label-champagne text-[0.68rem] tracking-[0.3em] uppercase">VelaBuilt</p>

      {phase === "loading" ? (
        <>
          <p className="mt-5 max-w-sm text-sm text-[var(--color-muted)]">
            Building the facility.
          </p>
          <div
            className="mt-6 h-px w-56 overflow-hidden bg-[var(--color-hairline)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Loading the facility"
          >
            <div
              className="h-full bg-[var(--color-champagne)] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(progress, 0.04) * 100}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <h2 className="display-lg mt-4 text-[var(--color-ivory)]">
            You can walk through this.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-ivory-dim)]">
            Seven spaces, in the order an inquiry actually travels through them.
            There is a guide who can walk with you, or you can have it quiet.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ThresholdButton onClick={() => onBegin(true)}>
              Enter with the guide
            </ThresholdButton>
            <ThresholdButton onClick={() => onBegin(false)}>
              Enter silently
            </ThresholdButton>
          </div>

          <p className="mt-6 text-[0.7rem] text-[var(--color-faint)]">
            Nothing listens until you ask it to.
          </p>

          <button
            type="button"
            onClick={onLeave}
            className="mt-8 text-[0.72rem] tracking-[0.12em] text-[var(--color-muted)] uppercase underline-offset-4 hover:text-[var(--color-ivory)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
          >
            Standard view
          </button>
        </>
      )}
    </div>
  );
}

function ThresholdButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--color-hairline-strong)] px-7 py-3 text-[0.78rem] tracking-[0.1em] text-[var(--color-ivory)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgb(224_195_152/0.06)] hover:text-[var(--color-champagne-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
    >
      {children}
    </button>
  );
}

/* ── the edge of the frame ──────────────────────────────────────────────── */

function Hud({
  hall,
  locked,
  touch,
  onLeave,
  onLook,
  onGoTo,
}: {
  hall: (typeof HALLS)[number] | null;
  locked: boolean;
  touch: boolean;
  onLeave: () => void;
  onLook: () => void;
  onGoTo: (id: HallId) => void;
}) {
  const index = hall ? ROUTE.indexOf(hall.id) : -1;
  const next = index >= 0 && index < ROUTE.length - 1 ? ROUTE[index + 1]! : null;

  return (
    <>
      {/* Where you are. Bottom-left, small, and it fades as you move on. */}
      <div className="pointer-events-none absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] z-20 max-w-[19rem]">
        {hall && (
          <>
            <p className="label-champagne text-[0.62rem] tracking-[0.28em] uppercase">
              {hall.name}
            </p>
            <p className="mt-1.5 text-[0.82rem] leading-snug text-[var(--color-ivory-dim)]">
              {hall.line}
            </p>
          </>
        )}
      </div>

      {/* The way out, and the way to buy. Both permanent, both top-right. */}
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-20 flex items-center gap-2">
        <a
          href="/start"
          className="rounded-full bg-[var(--color-champagne)] px-4 py-2 text-[0.72rem] font-medium tracking-[0.06em] text-[#17130c] transition-colors hover:bg-[var(--color-champagne-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
        >
          Start a project
        </a>
        <button
          type="button"
          onClick={onLeave}
          className="rounded-full border border-[var(--color-hairline-strong)] bg-[rgb(8_8_10/0.7)] px-4 py-2 text-[0.72rem] tracking-[0.06em] text-[var(--color-ivory-dim)] backdrop-blur-md transition-colors hover:text-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
        >
          Standard view
        </button>
      </div>

      {/* Desktop: the world is not looking until you click it, and it says so. */}
      {!touch && !locked && (
        <button
          type="button"
          onClick={onLook}
          className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(5_5_6/0.35)] text-[0.78rem] tracking-[0.12em] text-[var(--color-ivory)] uppercase backdrop-blur-[2px]"
        >
          <span className="rounded-full border border-[var(--color-hairline-strong)] bg-[rgb(8_8_10/0.75)] px-6 py-3">
            Click to look · W A S D to walk · Esc to release
          </span>
        </button>
      )}

      {/* A crosshair only while looking, and only a dot. */}
      {locked && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(242_239_233/0.55)]"
        />
      )}

      {/* Guided navigation. On a phone this is the primary way to move, and
          on desktop it is there for anyone who would rather not walk. */}
      {next && (
        <button
          type="button"
          onClick={() => onGoTo(next)}
          className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-full border border-[var(--color-hairline-strong)] bg-[rgb(8_8_10/0.78)] px-5 py-2.5 text-[0.72rem] tracking-[0.1em] text-[var(--color-ivory-dim)] backdrop-blur-md transition-colors hover:border-[var(--color-champagne)] hover:text-[var(--color-champagne-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
        >
          Go to {HALL_BY_ID[next].name} →
        </button>
      )}
    </>
  );
}

/* ── the thumb ──────────────────────────────────────────────────────────── */

/**
 * The stick is drawn where the thumb landed, not at a fixed rosette. It is
 * the difference between a control that works on a phone in one hand and one
 * that only works if you hold the device exactly as the designer did.
 */
function TouchLayer({ stick }: { stick: TouchStick }) {
  if (!stick.origin) {
    return (
      <p className="pointer-events-none absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] left-1/2 z-20 -translate-x-1/2 text-[0.68rem] tracking-[0.1em] text-[var(--color-faint)]">
        Left thumb to walk · right thumb to look
      </p>
    );
  }
  const dx = (stick.point?.x ?? stick.origin.x) - stick.origin.x;
  const dy = (stick.point?.y ?? stick.origin.y) - stick.origin.y;
  const len = Math.hypot(dx, dy);
  const k = Math.min(len, 58) / (len || 1);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      <span
        className="absolute h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(242_239_233/0.18)]"
        style={{ left: stick.origin.x, top: stick.origin.y }}
      />
      <span
        className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(224_195_152/0.5)] bg-[rgb(224_195_152/0.12)]"
        style={{ left: stick.origin.x + dx * k, top: stick.origin.y + dy * k }}
      />
    </div>
  );
}
