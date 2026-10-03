"use client";

import {
  ConversationProvider,
  useConversationClientTool,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEnquiryDialog } from "@/components/enquiry/EnquiryDialogProvider";
import { focusLabel, type Focus } from "@/content/enquiry-flow";
import { flare, setPresence, useVelaSnapshot, vela } from "@/vela/store";
import { lightCards, requestFocus } from "./bus";
import { parseToolCall, TOOL_NAMES, type Action } from "./tools";
import type { VoiceMode } from "./VoiceRoot";

/**
 * THE CONVERSATION — loaded only after the visitor chose to talk.
 *
 * The official React SDK owns the session; this component turns its state
 * into the object's behaviour and the agent's tool calls into movement:
 *
 *   status connecting              → connecting  (energy races inward)
 *   mode listening                 → listening   (the structure contracts)
 *   user finished, agent silent    → thinking    (the network computes)
 *   mode speaking                  → speaking    (the core radiates, driven
 *                                                 by the agent's output level)
 *   a client tool running          → acting      (the site moves)
 *
 * Every tool call goes through `parseToolCall` first. Invalid values are
 * refused with a sentence for the agent; nothing arbitrary is executed.
 *
 * If anything here fails — no session, microphone refused, network gone —
 * the panel says so plainly and the website carries on exactly as before.
 */

interface Line {
  readonly id: number;
  readonly who: "vela" | "you";
  readonly text: string;
}

type Failure = null | { kind: "mic" | "unavailable" | "dropped"; text: string };

interface PendingPrefill {
  readonly focus: Focus;
  readonly message: string;
  readonly resolve: (answer: string) => void;
}

export default function VoiceSession(props: {
  readonly mode: VoiceMode;
  readonly onEnd: () => void;
  readonly onSwitchToText: () => void;
}) {
  return (
    <ConversationProvider>
      <Panel {...props} />
    </ConversationProvider>
  );
}

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Panel({
  mode,
  onEnd,
  onSwitchToText,
}: {
  readonly mode: VoiceMode;
  readonly onEnd: () => void;
  readonly onSwitchToText: () => void;
}) {
  const controls = useConversationControls();
  const { status } = useConversationStatus();
  const { mode: talkMode } = useConversationMode();
  const { isMuted, setMuted } = useConversationInput();
  const router = useRouter();
  const pathname = usePathname();
  const dialog = useEnquiryDialog();
  const { chapter } = useVelaSnapshot();

  const [lines, setLines] = useState<Line[]>([]);
  const [failureState, setFailure] = useState<Failure>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [acting, setActing] = useState(false);
  const [draft, setDraft] = useState("");
  const [prefill, setPrefill] = useState<PendingPrefill | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const started = useRef(false);
  const lineId = useRef(0);
  const actTimer = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLOListElement>(null);

  const failure: Failure = useMemo(
    () =>
      failureState ??
      (status === "error" ? { kind: "dropped", text: "Vela lost the connection. The site is unaffected." } : null),
    [failureState, status],
  );

  const addLine = useCallback((who: Line["who"], text: string) => {
    const t = text.trim();
    if (!t) return;
    setLines((ls) => [...ls.slice(-7), { id: ++lineId.current, who, text: t }]);
  }, []);

  /* ── start ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setPresence("connecting");

    (async () => {
      if (mode === "voice") {
        // Asked here, on the visitor's explicit choice, so a refusal can be
        // handled plainly instead of surfacing as a transport error.
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          setFailure({
            kind: "mic",
            text: "The microphone is blocked, so Vela can’t hear you. You can allow it in the browser’s site settings, or carry on by typing.",
          });
          setPresence("dormant");
          return;
        }
      }

      let session: { kind: string; agentId?: string; signedUrl?: string; token?: string };
      try {
        const res = await fetch("/api/voice/session", { method: "POST" });
        if (!res.ok) throw new Error(String(res.status));
        session = await res.json();
      } catch {
        setFailure({
          kind: "unavailable",
          text: "Vela isn’t available right now. Everything on the site still works — or email jace@velabuilt.com.",
        });
        setPresence("dormant");
        return;
      }

      const common = {
        textOnly: mode === "text",
        dynamicVariables: {
          current_page: document.title.replace(/ — VelaBuilt$/, ""),
          current_path: window.location.pathname,
          mode,
        },
        onConnect: () => {
          vela.readLevels = () => ({
            input: Math.min(1, controls.getInputVolume() * 2.2),
            output: Math.min(1, controls.getOutputVolume() * 1.8),
          });
        },
        onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
          if (source === "user") {
            addLine("you", message);
            setAwaiting(true);
          } else {
            addLine("vela", message);
            setAwaiting(false);
          }
        },
        onModeChange: ({ mode: m }: { mode: string }) => {
          if (m === "speaking") setAwaiting(false);
        },
        onError: (message: string) => {
          console.warn("[velabuilt] voice:", message);
        },
        onDisconnect: (details?: { reason?: string }) => {
          vela.readLevels = null;
          if (details && details.reason === "error") {
            setFailure({ kind: "dropped", text: "The connection dropped. The site is unaffected." });
          }
        },
      };

      try {
        if (session.kind === "token" && session.token) {
          controls.startSession({ ...common, conversationToken: session.token, connectionType: "webrtc" });
        } else if (session.kind === "signed" && session.signedUrl) {
          controls.startSession({ ...common, signedUrl: session.signedUrl, connectionType: "websocket" });
        } else if (session.agentId) {
          controls.startSession({ ...common, agentId: session.agentId, connectionType: mode === "text" ? "websocket" : "webrtc" });
        } else {
          throw new Error("no session");
        }
      } catch {
        setFailure({ kind: "unavailable", text: "Vela couldn’t start. The site works the same without it." });
        setPresence("dormant");
      }
    })();
    // Mount-only by design: one session per mount; VoiceRoot re-keys for a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── state → object ─────────────────────────────────────────────────── */

  useEffect(() => {
    if (failure) return setPresence("dormant");
    if (acting) return setPresence("acting");
    if (status === "connecting") return setPresence("connecting");
    if (status !== "connected") return;
    if (mode === "text") return setPresence(awaiting ? "thinking" : "aware");
    if (talkMode === "speaking") return setPresence("speaking");
    setPresence(awaiting ? "thinking" : "listening");
  }, [status, talkMode, awaiting, acting, failure, mode]);


  // Keep the guide oriented, without it narrating every scroll.
  const lastContext = useRef("");
  useEffect(() => {
    if (status !== "connected") return;
    const label = chapterLabel(chapter, pathname);
    if (label === lastContext.current) return;
    lastContext.current = label;
    controls.sendContextualUpdate(
      `The visitor is now looking at: ${label}. Do not comment on this unless they ask.`,
    );
  }, [chapter, pathname, status, controls]);

  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [lines]);

  useEffect(
    () => () => {
      window.clearTimeout(actTimer.current);
      vela.readLevels = null;
    },
    [],
  );

  /* ── tools ──────────────────────────────────────────────────────────── */

  const act = useCallback(() => {
    setActing(true);
    flare(1);
    window.clearTimeout(actTimer.current);
    actTimer.current = window.setTimeout(() => setActing(false), 1600);
  }, []);

  const scrollToSection = useCallback((section: string) => {
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    return !!el;
  }, []);

  const perform = useCallback(
    async (action: Action): Promise<string> => {
      switch (action.kind) {
        case "navigate":
          act();
          if (action.path === pathname) return `They are already on ${action.label}.`;
          router.push(action.path);
          return `Moved them to ${action.label}.`;

        case "scroll":
          act();
          if (pathname === "/") {
            scrollToSection(action.section);
          } else {
            router.push(`/#${action.section}`);
          }
          return `Showing them ${action.label}.`;

        case "focus": {
          act();
          const req = { section: action.section, area: action.area, capability: action.capability };
          // In place if this page already shows the area; otherwise home.
          if (pathname === "/" || document.querySelector(`[data-area="${action.area}"]`)) {
            if (!scrollToSection(action.section)) {
              document.querySelector(`[data-area="${action.area}"]`)?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
            }
            window.setTimeout(() => lightCards(req), reduced() ? 0 : 700);
          } else {
            requestFocus(req);
            router.push(`/#${action.section}`);
          }
          return `Showing them ${action.label}. The structure has changed to match.`;
        }

        case "project":
          act();
          router.push(action.path);
          return `Opened the ${action.label} case study.`;

        case "contact":
          act();
          if (!dialog) {
            router.push(action.focus ? `/start?focus=${action.focus}` : "/start");
          } else {
            dialog.open(action.focus);
          }
          return "The enquiry form is open. They fill it in and send it themselves.";

        case "prefill": {
          // The agent should already have asked. The visitor confirms here too,
          // so a summary can never land in the form without their say-so.
          const answer = await new Promise<string>((resolve) => {
            const timer = window.setTimeout(() => {
              setPrefill(null);
              resolve("They did not respond to the prompt. Nothing was added to the form.");
            }, 100_000);
            setPrefill({
              focus: action.focus,
              message: action.message,
              resolve: (a) => {
                window.clearTimeout(timer);
                resolve(a);
              },
            });
          });
          return answer;
        }
      }
    },
    [act, dialog, pathname, router, scrollToSection],
  );

  const handle = (name: string) => async (params: Record<string, unknown>) => {
    const parsed = parseToolCall(name, params);
    if (!parsed.ok) return parsed.message;
    try {
      return await perform(parsed.action);
    } catch {
      return "That did not work on the page. Tell them plainly and carry on.";
    }
  };

  useConversationClientTool(TOOL_NAMES[0], handle(TOOL_NAMES[0]));
  useConversationClientTool(TOOL_NAMES[1], handle(TOOL_NAMES[1]));
  useConversationClientTool(TOOL_NAMES[2], handle(TOOL_NAMES[2]));
  useConversationClientTool(TOOL_NAMES[3], handle(TOOL_NAMES[3]));
  useConversationClientTool(TOOL_NAMES[4], handle(TOOL_NAMES[4]));
  useConversationClientTool(TOOL_NAMES[5], handle(TOOL_NAMES[5]));
  useConversationClientTool(TOOL_NAMES[6], handle(TOOL_NAMES[6]));

  /* ── controls ───────────────────────────────────────────────────────── */

  const end = useCallback(() => {
    prefill?.resolve("The conversation ended. Nothing was added to the form.");
    try {
      controls.endSession();
    } catch {
      /* already closed */
    }
    onEnd();
  }, [controls, onEnd, prefill]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) end();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [end]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || status !== "connected") return;
    controls.sendUserMessage(text);
    addLine("you", text);
    setAwaiting(true);
    setDraft("");
  };

  const state = failure
    ? "Unavailable"
    : status === "connecting" || status === "disconnected"
      ? status === "connecting"
        ? "Connecting"
        : "Ended"
      : acting
        ? "Moving the site"
        : mode === "text"
          ? awaiting
            ? "Thinking"
            : "Ready"
          : talkMode === "speaking"
            ? "Speaking"
            : awaiting
              ? "Thinking"
              : isMuted
                ? "Muted"
                : "Listening";

  return (
    <section
      className="voice-panel"
      aria-label="Conversation with Vela"
      data-collapsed={collapsed || undefined}
    >
      <header className="flex items-center justify-between gap-3 border-b border-[color:var(--color-hairline)] px-4 py-3">
        <p className="label flex items-center gap-2.5 !text-[color:var(--color-ivory)]">
          <span className="voice-dot" aria-hidden="true" />
          Vela
          <span className="text-[color:var(--color-muted)]" aria-live="polite">
            · {state}
          </span>
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="voice-icon"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Show conversation" : "Hide conversation"}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d={collapsed ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"} fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
        </div>
      </header>

      {!collapsed ? (
        <>
          {failure ? (
            <div className="px-4 py-5">
              <p className="text-sm leading-relaxed" role="alert">
                {failure.text}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {failure.kind === "mic" ? (
                  <button type="button" className="btn" onClick={onSwitchToText}>
                    Type instead
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost" onClick={onEnd}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <ol ref={logRef} className="voice-log" aria-live="polite" aria-relevant="additions">
              {lines.length === 0 ? (
                <li className="text-sm text-[color:var(--color-muted)]">
                  {status === "connected"
                    ? mode === "text"
                      ? "Ask Vela anything about VelaBuilt."
                      : "Vela is listening. Ask what VelaBuilt builds, or say “show me”."
                    : "Opening a line to Vela…"}
                </li>
              ) : (
                lines.map((l) => (
                  <li key={l.id} data-who={l.who}>
                    <span className="sr-only">{l.who === "vela" ? "Vela: " : "You: "}</span>
                    {l.text}
                  </li>
                ))
              )}
            </ol>
          )}

          {prefill ? (
            <div className="border-t border-[color:var(--color-hairline)] px-4 py-4" role="group" aria-label="Vela drafted an enquiry">
              <p className="label">Put this in the enquiry form?</p>
              <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                {prefill.message}
              </p>
              <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                As “{focusLabel[prefill.focus]}”. You can edit it before sending; nothing is sent automatically.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    dialog?.open(undefined, { focus: prefill.focus, message: prefill.message });
                    prefill.resolve("The form is open with the summary in it. They will review, edit and send it themselves.");
                    setPrefill(null);
                    flare(0.8);
                  }}
                >
                  Yes, open the form
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    prefill.resolve("They declined. Nothing was added to the form.");
                    setPrefill(null);
                  }}
                >
                  No thanks
                </button>
              </div>
            </div>
          ) : null}

          {!failure ? (
            <form onSubmit={send} className="flex items-center gap-2 border-t border-[color:var(--color-hairline)] px-3 py-3">
              <label htmlFor="vela-text" className="sr-only">
                Type to Vela
              </label>
              <input
                ref={inputRef}
                id="vela-text"
                className="field !py-2.5 !text-sm"
                placeholder={mode === "text" ? "Type your question" : "Or type instead"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                autoComplete="off"
                disabled={status !== "connected"}
              />
              <button type="submit" className="btn !min-h-[2.6rem] !px-3" disabled={status !== "connected" || !draft.trim()}>
                Send
              </button>
            </form>
          ) : null}
        </>
      ) : null}

      <footer className="flex items-center justify-between gap-2 border-t border-[color:var(--color-hairline)] px-3 py-2.5">
        {mode === "voice" && !failure ? (
          <button
            type="button"
            className="btn btn-ghost !min-h-[2.5rem]"
            aria-pressed={isMuted}
            onClick={() => setMuted(!isMuted)}
          >
            {isMuted ? "Unmute mic" : "Mute mic"}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn !min-h-[2.5rem]" onClick={end}>
          End conversation
        </button>
      </footer>
    </section>
  );
}

function chapterLabel(chapter: string, pathname: string): string {
  const names: Record<string, string> = {
    opening: "the homepage opening",
    digital: "the Digital Experiences section",
    ai: "the AI Systems section",
    automation: "the Automation section",
    systems: "the Business Systems section",
    work: "the selected work (Cardio Life)",
    answers: "the plain answers about VelaBuilt",
    contact: "the contact section",
  };
  if (pathname === "/") return names[chapter] ?? "the homepage";
  return `the page ${pathname}`;
}
