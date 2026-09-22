/**
 * THE GUIDE.
 *
 * A conversation with someone who is standing in the room with you, rather
 * than a chat bubble in the corner that happens to be on the same page.
 *
 * ── WHAT MAKES IT IN-WORLD RATHER THAN BOLTED ON ─────────────────────────
 *
 * Context. The agent is told which hall the visitor is in, and told again
 * every time they walk into a different one. So "what am I looking at?" is
 * answerable, and the answer is about the room they are standing in. That
 * single channel is the whole difference between a guide and a chatbot.
 *
 * Actions. The agent can move the visitor, open the enquiry form, or put
 * them back on the ordinary website — through three named tools and a
 * switch. It cannot touch the DOM, cannot navigate to an arbitrary URL and
 * cannot run anything. The set of things it is able to do is the set of
 * things written in `Actions` below, and that is enforced here rather than
 * asked for in a prompt.
 *
 * ── CONSENT ──────────────────────────────────────────────────────────────
 *
 * Nothing in this file runs until the visitor presses "Enter with the
 * guide". The microphone is requested at that moment and not before, by
 * the SDK, in response to a real gesture. There is no pre-warming, no
 * silent getUserMedia to "check permissions", and no conversation opened
 * speculatively. A visitor who chooses silence never loads this module at
 * all — it is a dynamic import.
 *
 * ── WHY THE SESSION IS MINTED SERVER-SIDE ────────────────────────────────
 *
 * The agent currently has auth disabled, so the public agent id alone would
 * work. We ask our own server for a session anyway: the moment the allowlist
 * is turned on (and it should be), this path already mints a signed URL with
 * a key that never reaches the browser. Building it the other way round
 * means shipping the key or rewriting this later under pressure.
 */

import type { Conversation } from "@elevenlabs/client";
import { HALL_BY_ID, type HallId } from "./facility";

/** The only things the guide is able to make the site do. */
export interface Actions {
  navigate(hall: HallId): void;
  openEnquiry(topic?: string): void;
  exitToStandard(): void;
}

export type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "failed";

export interface VoiceLine {
  readonly who: "guide" | "visitor";
  readonly text: string;
}

export interface VoiceHandle {
  /** Tell the guide the visitor has walked somewhere. */
  moveTo(hall: HallId | null): void;
  setMuted(muted: boolean): void;
  stop(): Promise<void>;
}

export interface VoiceCallbacks {
  onStatus(s: VoiceStatus): void;
  /** Newest line. The interface keeps whatever backlog it wants. */
  onLine(line: VoiceLine): void;
}

/**
 * Open the conversation. Rejects if the session cannot be minted or the
 * visitor refuses the microphone — the caller turns the guide back off and
 * the world carries on in silence, which is a complete experience.
 */
export async function startGuide(
  actions: Actions,
  cb: VoiceCallbacks,
  initialHall: HallId | null,
): Promise<VoiceHandle> {
  cb.onStatus("connecting");

  const res = await fetch("/api/voice/session", { method: "POST" });
  if (!res.ok) throw new Error(`voice session refused (${res.status})`);
  const session = (await res.json()) as
    | { kind: "signed"; signedUrl: string }
    | { kind: "public"; agentId: string };

  const { Conversation: Conv } = await import("@elevenlabs/client");

  const hall = initialHall ? HALL_BY_ID[initialHall] : null;

  let last: HallId | null = initialHall;

  /* The SDK's options are a discriminated union on how the session is
     addressed, so the two branches are written out rather than spread — a
     spread erases the discriminant and the whole union stops narrowing.
     `connectionType` is left to the SDK: a signed URL is a WebSocket session
     by definition, and pinning it to webrtc here is a type error rather than
     a preference. */
  const base = {
    // Seeded so the guide's very first answer already knows the room.
    dynamicVariables: {
      current_space: hall?.name ?? "Arrival",
      space_line: hall?.line ?? "Where the inquiry comes in.",
    },

    clientTools: {
      navigate_to_space: ({ space }: { space: string }) => {
        if (!isHallId(space)) return "That space does not exist.";
        actions.navigate(space);
        return `Walking them to ${HALL_BY_ID[space].name}.`;
      },
      open_enquiry: ({ topic }: { topic?: string }) => {
        actions.openEnquiry(typeof topic === "string" ? topic : undefined);
        return "The enquiry form is open in front of them.";
      },
      exit_to_standard_view: () => {
        actions.exitToStandard();
        return "They are back on the ordinary site.";
      },
    },

    onModeChange: ({ mode }: { mode: string }) =>
      cb.onStatus(mode === "speaking" ? "speaking" : "listening"),
    onStatusChange: ({ status }: { status: string }) => {
      if (status === "connected") cb.onStatus("listening");
      if (status === "disconnected") cb.onStatus("idle");
    },
    onMessage: ({ message, source }: { message: unknown; source: string }) => {
      const text = String(message ?? "").trim();
      if (text) cb.onLine({ who: source === "ai" ? "guide" : "visitor", text });
    },
    onError: (e: unknown) => {
      console.warn("[velabuilt] guide error:", e);
      cb.onStatus("failed");
    },
  } as const;

  const conversation: Conversation =
    session.kind === "signed"
      ? await Conv.startSession({ ...base, signedUrl: session.signedUrl })
      : await Conv.startSession({ ...base, agentId: session.agentId });

  return {
    moveTo(next) {
      if (next === last) return;
      last = next;
      const h = next ? HALL_BY_ID[next] : null;
      // A contextual update is not a user turn: the guide is told where the
      // visitor now is and does NOT answer it. Anything else would mean
      // being narrated at every time you walked through a doorway, which is
      // precisely the thing that makes these feel like a gimmick.
      conversation.sendContextualUpdate(
        h
          ? `The visitor has walked into ${h.name}. ${h.line} Do not comment on this unless they ask.`
          : "The visitor is in a corridor between spaces. Do not comment on this.",
      );
    },
    setMuted(muted) {
      // Muting the microphone, not the guide's voice. A visitor who wants
      // the guide to stop talking presses the same control the ambience
      // uses; this one is about whether the room is listening.
      conversation.setMicMuted(muted);
    },
    async stop() {
      try {
        await conversation.endSession();
      } catch {
        /* Already gone. Nothing to do and nothing worth saying. */
      }
    },
  };
}

const isHallId = (v: string): v is HallId =>
  Object.prototype.hasOwnProperty.call(HALL_BY_ID, v);
