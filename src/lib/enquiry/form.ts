/**
 * NATIVE FORM SUBMISSIONS — the no-JavaScript path into the same contract.
 *
 * The /start form posts application/x-www-form-urlencoded straight to
 * /api/enquiry when scripts are unavailable. This maps those fields onto the
 * exact object the JSON path sends, so `enquirySchema` stays the single
 * definition of a valid enquiry for both.
 *
 * Field names are the ones rendered by EnquiryFlow: `focus`, one field per
 * question id (`website-problem`, `timeline`, …), the contact fields, `consent`,
 * the honeypot `role`, and `t` — the time the form was rendered.
 */

import {
  FOCUS_OPTIONS,
  branchSteps,
  focusStep,
  timelineStep,
  type Focus,
} from "@/content/enquiry-flow";
import { answersForFocus } from "./format";

/** Form field names, shared with the renderer so the two cannot drift. */
export const FORM_FIELDS = {
  honeypot: "role",
  renderedAt: "t",
  consent: "consent",
} as const;

/**
 * The moment a server render hands this visitor the form, sent back as `t`.
 * Called from a server component, which renders once per request.
 */
export function formIssuedAt(): number {
  return Date.now();
}

const QUESTION_IDS = [
  focusStep.id,
  ...Object.values(branchSteps).map((step) => step.id),
  timelineStep.id,
];

/**
 * Elapsed time from the render timestamp. A missing, malformed or future
 * value is "unknown", and unknown is never treated as a bot: silently
 * dropping a real person's enquiry is a worse failure than letting a bot
 * through to the honeypot and rate limit.
 */
function elapsedSince(rendered: string | null, now: number): number {
  const at = Number(rendered);
  if (!rendered || !Number.isFinite(at) || at <= 0 || at > now) {
    return Number.MAX_SAFE_INTEGER;
  }
  return now - at;
}

export function formToEnquiry(form: URLSearchParams, now = Date.now()): unknown {
  const rawFocus = form.get("focus");
  const focus = FOCUS_OPTIONS.includes(rawFocus as Focus) ? (rawFocus as Focus) : null;

  const answers: Record<string, string[]> = {};
  for (const id of QUESTION_IDS) {
    const values = form.getAll(id).filter(Boolean);
    if (values.length > 0) answers[id] = values;
  }

  const optional = (key: string) => {
    const value = form.get(key)?.trim();
    return value ? value : undefined;
  };

  return {
    // An invalid focus is passed through so the schema reports it.
    focus: focus ?? rawFocus ?? undefined,
    answers: focus ? answersForFocus(focus, answers) : {},
    name: form.get("name") ?? "",
    email: form.get("email")?.trim() ?? "",
    company: optional("company"),
    website: optional("website"),
    message: optional("message"),
    consent: form.has(FORM_FIELDS.consent),
    hp: form.get(FORM_FIELDS.honeypot) ?? "",
    elapsedMs: elapsedSince(form.get(FORM_FIELDS.renderedAt), now),
  };
}
