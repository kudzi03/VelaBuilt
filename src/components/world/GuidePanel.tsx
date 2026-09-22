"use client";

/**
 * THE GUIDE, AS SEEN.
 *
 * Bottom-right, small, and honest about three things at all times: whether
 * the microphone is open, whether the guide is speaking, and how to make it
 * stop. A voice interface that hides any of those is not elegant, it is
 * evasive.
 *
 * ── SUBTITLES ────────────────────────────────────────────────────────────
 *
 * The last few lines are on screen by default rather than behind a toggle.
 * They are there for someone who cannot hear it, someone in an open-plan
 * office, and someone who simply wants to check what was said — which is
 * everybody, occasionally. Announced politely via aria-live so a screen
 * reader gets the guide's answers without being read the whole backlog.
 *
 * ── WHAT IT DELIBERATELY IS NOT ──────────────────────────────────────────
 *
 * Not a chat bubble with an avatar. Not a floating orb. Not a thing that
 * follows you around pulsing for attention. It is a status line and a
 * transcript, sized so it never competes with the room.
 */

import { useEffect, useRef, useState } from "react";
import type { VoiceLine, VoiceStatus } from "@/world/voice";

interface Props {
  status: VoiceStatus;
  lines: readonly VoiceLine[];
  micMuted: boolean;
  onToggleMic: () => void;
  onStop: () => void;
}

const LABEL: Record<VoiceStatus, string> = {
  idle: "Guide off",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  failed: "Guide unavailable",
};

export function GuidePanel({ status, lines, micMuted, onToggleMic, onStop }: Props) {
  const [showAll, setShowAll] = useState(false);
  const log = useRef<HTMLDivElement>(null);

  // Keep the newest line in view without yanking the page around.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  if (status === "idle") return null;

  const recent = showAll ? lines : lines.slice(-3);
  const live = status === "listening" || status === "speaking";

  return (
    <div className="pointer-events-auto absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 w-[min(22rem,calc(100vw-2rem))]">
      {lines.length > 0 && (
        <div
          ref={log}
          className="mb-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--color-hairline)] bg-[rgb(8_8_10/0.82)] px-3.5 py-3 backdrop-blur-md"
          aria-live="polite"
          aria-atomic="false"
          aria-label="What the guide has said"
        >
          {recent.map((l, i) => (
            <p
              key={`${i}-${l.text.slice(0, 12)}`}
              className={
                l.who === "guide"
                  ? "mt-1.5 text-[0.8rem] leading-snug text-[var(--color-ivory-dim)] first:mt-0"
                  : "mt-1.5 text-[0.8rem] leading-snug text-[var(--color-faint)] italic first:mt-0"
              }
            >
              {l.text}
            </p>
          ))}
          {lines.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 text-[0.64rem] tracking-[0.12em] text-[var(--color-muted)] uppercase hover:text-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
            >
              {showAll ? "Show less" : `All ${lines.length} lines`}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-[var(--color-hairline-strong)] bg-[rgb(8_8_10/0.86)] px-3 py-2 backdrop-blur-md">
        <span
          aria-hidden
          className={
            "h-1.5 w-1.5 shrink-0 rounded-full " +
            (status === "speaking"
              ? "bg-[var(--color-champagne)]"
              : status === "listening"
                ? micMuted
                  ? "bg-[var(--color-muted)]"
                  : "bg-[#5fd08a]"
                : status === "failed"
                  ? "bg-[#d05f5f]"
                  : "bg-[var(--color-muted)]")
          }
        />
        <span className="flex-1 text-[0.72rem] tracking-[0.04em] text-[var(--color-ivory-dim)]">
          {micMuted && live ? "Microphone off" : LABEL[status]}
        </span>

        {live && (
          <button
            type="button"
            onClick={onToggleMic}
            aria-pressed={micMuted}
            className="rounded-full px-2.5 py-1 text-[0.68rem] tracking-[0.06em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
          >
            {micMuted ? "Unmute" : "Mute"}
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          className="rounded-full px-2.5 py-1 text-[0.68rem] tracking-[0.06em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-champagne)]"
        >
          End
        </button>
      </div>
    </div>
  );
}
