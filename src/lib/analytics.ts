/**
 * ANALYTICS — first-party, cookie-free, server-forwarded to Google Analytics 4.
 *
 * How it works:
 *   - The browser loads no Google script. It sends small JSON beacons to this
 *     site's own endpoint, /api/track.
 *   - The endpoint checks each event against the allowlist below, adds the
 *     visitor's country/region (from Vercel's edge headers) and a coarse
 *     device category, and forwards to GA4 via the Measurement Protocol.
 *   - Nothing is stored in the browser: no cookies, no localStorage, no
 *     sessionStorage. The visit id is random and lives in memory for the tab,
 *     so a returning visitor counts as new and one visit cannot be linked to
 *     another.
 *   - Events carry no personal data: never a name, email, message or answer
 *     text. The enquiry event carries only which area the enquiry is about.
 *
 * Shared by the client (Analytics.tsx) and the server (api/track) so the two
 * can never disagree about what is allowed.
 */

export const TRACK_EVENTS = [
  "page_view",
  "generate_lead", // enquiry accepted by the server — the primary key event
  "enquiry_error", // enquiry submitted but rejected or failed
  "start_project_click", // any link to /start
  "email_click", // mailto:
  "phone_click", // tel:
  "whatsapp_click", // wa.me / whatsapp
  "book_call_click", // a scheduling link (Calendly, Cal.com, Google booking)
  "vela_talk_click", // a Talk to Vela control pressed
  "vela_conversation_start", // Vela actually connected
  "demo_interaction", // System Lab / demo interaction
  "scroll", // 90% depth on a page
] as const;

export type TrackEvent = (typeof TRACK_EVENTS)[number];

/** Parameters the server will forward. Anything else is dropped. */
export const TRACK_PARAMS = [
  "page_location",
  "page_path",
  "page_title",
  "page_referrer",
  "entry_referrer",
  "link_location",
  "link_text",
  "enquiry_focus",
  "method",
  "status",
  "mode",
  "demo",
  "percent_scrolled",
] as const;

export type TrackParams = Partial<Record<(typeof TRACK_PARAMS)[number], string | number>>;

export interface TrackPayload {
  readonly cid: string;
  readonly sid: number;
  readonly first?: boolean;
  readonly name: TrackEvent;
  readonly params: TrackParams;
}

/** Enabled in production builds only (NEXT_PUBLIC_ANALYTICS=1). */
export const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS === "1";

// ---- client side -----------------------------------------------------------

let visit: { cid: string; sid: number; sentFirst: boolean } | null = null;

function currentVisit() {
  if (!visit) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    const now = Math.floor(Date.now() / 1000);
    visit = { cid: `${a[0]}.${now}`, sid: now, sentFirst: false };
  }
  return visit;
}

export function track(name: TrackEvent, params: TrackParams = {}) {
  if (!analyticsEnabled || typeof window === "undefined") return;
  const v = currentVisit();
  const payload: TrackPayload = {
    cid: v.cid,
    sid: v.sid,
    first: !v.sentFirst || undefined,
    name,
    params: {
      page_location: window.location.href,
      page_title: document.title,
      ...params,
    },
  };
  v.sentFirst = true;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => undefined,
  );
}
