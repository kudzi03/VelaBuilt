/**
 * ANALYTICS — Google Analytics 4, run without browser storage.
 *
 * What this collects, and what it deliberately does not:
 *
 *   - GA4 is configured with `client_storage: "none"`. It sets no cookies and
 *     writes nothing to localStorage or sessionStorage. The client id lives in
 *     memory for the life of the tab, so a visit holds together across
 *     in-site navigation, and a returning visitor is counted as new.
 *   - Google signals and ad personalisation are off; ad storage is denied.
 *   - Events carry no personal data: never a name, email, message or answer
 *     text. The enquiry event carries only which area the enquiry is about.
 *
 * If the measurement id is unset (development, previews), every function here
 * is a no-op and no Google script is loaded.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const analyticsEnabled = /^G-[A-Z0-9]{6,12}$/.test(GA_MEASUREMENT_ID);

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/** The events this site reports. Keep in step with ANALYTICS.md. */
export type TrackEvent =
  | "generate_lead" // enquiry accepted by the server — the primary key event
  | "enquiry_error" // enquiry submitted but rejected or failed
  | "enquiry_step" // a step of the enquiry flow answered
  | "start_project_click" // any link to /start
  | "email_click" // mailto:
  | "phone_click" // tel:
  | "whatsapp_click" // wa.me / api.whatsapp.com
  | "book_call_click" // a scheduling link (Calendly, Cal.com, Google booking)
  | "vela_talk_click" // a Talk to Vela control pressed
  | "vela_conversation_start" // Vela actually connected
  | "demo_interaction"; // System Lab / demo interaction

export function track(event: TrackEvent, params: Record<string, string | number | boolean | undefined> = {}) {
  if (!analyticsEnabled || typeof window === "undefined" || typeof window.gtag !== "function") return;
  const clean: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;
  window.gtag("event", event, clean);
}
