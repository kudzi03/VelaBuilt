"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { setPresence, setVoiceOpen, vela } from "@/vela/store";

/**
 * VOICE — the part that is always on the page, and weighs almost nothing.
 *
 * It owns one decision: whether a conversation exists. Nothing from the
 * ElevenLabs SDK is loaded until the visitor has read what the microphone is
 * for and chosen to start; a visitor who never talks to Vela never downloads
 * it. The session itself (`VoiceSession`) is a dynamic import.
 *
 * Entry points all dispatch `vela:talk`: the object's hit target, the header
 * control, and any "Talk to Vela" button on a page.
 */

const VoiceSession = dynamic(() => import("./VoiceSession"), { ssr: false });

export type VoiceMode = "voice" | "text";

/** Warm the SDK chunk when someone reaches for Vela, before they commit. */
export function prefetchVoice() {
  void import("./VoiceSession");
}

export function VoiceRoot() {
  const [phase, setPhase] = useState<"idle" | "consent" | "session">("idle");
  const [mode, setMode] = useState<VoiceMode>("voice");
  const [sessionKey, setSessionKey] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onTalk = () => {
      opener.current = document.activeElement as HTMLElement | null;
      setPhase((p) => (p === "session" ? p : "consent"));
      prefetchVoice();
    };
    window.addEventListener("vela:talk", onTalk);
    return () => window.removeEventListener("vela:talk", onTalk);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (phase === "consent" && !d.open) d.showModal();
    if (phase !== "consent" && d.open) d.close();
  }, [phase]);

  useEffect(() => {
    setVoiceOpen(phase !== "idle");
  }, [phase]);

  const begin = (m: VoiceMode) => {
    setMode(m);
    setSessionKey((k) => k + 1);
    setPhase("session");
  };

  const end = useCallback(() => {
    setPhase("idle");
    vela.readLevels = null;
    setPresence("dormant");
    opener.current?.focus?.();
  }, []);

  return (
    <>
      <dialog
        ref={dialogRef}
        className="voice-consent"
        aria-labelledby="voice-consent-title"
        aria-describedby="voice-consent-body"
        onClose={() => setPhase((p) => (p === "consent" ? "idle" : p))}
        onClick={(e) => {
          if (e.target === dialogRef.current) setPhase("idle");
        }}
      >
        <div className="voice-consent__inner">
          <p className="label flex items-center gap-3">
            <span className="voice-dot" aria-hidden="true" /> Vela · VelaBuilt’s guide
          </p>
          <h2 id="voice-consent-title" className="display-md mt-6">
            Talk to Vela
          </h2>
          <div id="voice-consent-body">
            <p className="mt-5 leading-relaxed text-[color:var(--color-ivory-dim)]">
              Ask what VelaBuilt builds, how a project runs, or to be shown something —
              Vela can move you through the site while it talks.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--color-muted)]">
              Your browser will ask for the microphone. It is used only while the
              conversation is open; you can mute or end it at any time. Vela is an AI,
              run on ElevenLabs. Audio is not stored; the text transcript is kept for 30
              days so the studio can improve the guide.{" "}
              <Link href="/privacy#talking-to-vela" className="underline underline-offset-4" onClick={() => setPhase("idle")}>
                Privacy
              </Link>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => begin("voice")} autoFocus>
              Start talking
            </button>
            <button type="button" className="btn" onClick={() => begin("text")}>
              Type instead
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPhase("idle")}>
              Not now
            </button>
          </div>
        </div>
      </dialog>

      {phase === "session" ? <VoiceSession key={sessionKey} mode={mode} onEnd={end} onSwitchToText={() => begin("text")} /> : null}
    </>
  );
}

/** A "Talk to Vela" control for anywhere in the page. */
export function TalkButton({
  className,
  children = "Talk to Vela",
}: {
  readonly className?: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className ?? "btn"}
      onPointerEnter={prefetchVoice}
      onFocus={prefetchVoice}
      onClick={() => window.dispatchEvent(new CustomEvent("vela:talk"))}
    >
      <span className="voice-dot" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}
