/**
 * An enquiry as plain text — one rendering shared by the notification email,
 * the no-JavaScript fallback page and the in-form mailto fallback, so what the
 * studio receives and what a visitor is offered to send by hand never differ.
 *
 * Client-safe: content imports only.
 */

import {
  focusLabel,
  labelForAnswer,
  stepsForFocus,
  type Focus,
} from "@/content/enquiry-flow";
import { site } from "@/content/site";

export interface EnquiryDraft {
  readonly focus?: Focus | null;
  readonly answers?: Readonly<Record<string, readonly string[] | undefined>>;
  readonly name?: string;
  readonly email?: string;
  readonly company?: string;
  readonly website?: string;
  readonly message?: string;
  readonly reference?: string;
  readonly receivedAt?: string;
  readonly source?: string;
}

/**
 * Keeps only the answers that belong to the chosen focus. A visitor who goes
 * back and changes their first answer leaves the old branch's answers behind;
 * sending them would fail server validation for a reason nobody can see.
 */
export function answersForFocus(
  focus: Focus,
  answers: Readonly<Record<string, readonly string[] | undefined>>,
): Record<string, string[]> {
  const kept: Record<string, string[]> = {};
  for (const step of stepsForFocus(focus)) {
    const values = answers[step.id];
    if (values && values.length > 0) kept[step.id] = [...values];
  }
  return kept;
}

export function enquiryText(draft: EnquiryDraft): string {
  const lines: string[] = [];

  if (draft.reference) lines.push(`Reference: ${draft.reference}`);
  if (draft.receivedAt) lines.push(`Received: ${draft.receivedAt}`);
  if (draft.source) lines.push(`Source: ${draft.source}`);
  if (lines.length > 0) lines.push("");

  if (draft.focus) {
    const answers = answersForFocus(draft.focus, draft.answers ?? {});
    for (const step of stepsForFocus(draft.focus)) {
      const values = answers[step.id];
      if (!values) continue;
      lines.push(step.question);
      for (const value of values) {
        lines.push(`  - ${labelForAnswer(step.id, value)}`);
      }
    }
    lines.push("");
  }

  const contact: [string, string | undefined][] = [
    ["Name", draft.name],
    ["Email", draft.email],
    ["Company", draft.company],
    ["Website", draft.website],
  ];
  for (const [label, value] of contact) {
    if (value?.trim()) lines.push(`${label}: ${value.trim()}`);
  }

  if (draft.message?.trim()) {
    lines.push("", "Message:", draft.message.trim());
  }

  return lines.join("\n").trim();
}

export function enquirySubject(focus?: Focus | null, reference?: string): string {
  const topic = focus ? focusLabel[focus] : "Start a project";
  return reference ? `Inquiry ${reference} — ${topic}` : `Inquiry — ${topic}`;
}

/**
 * Mail clients truncate or refuse very long mailto: URLs, so the body is
 * capped. The fallback page shows the full text alongside for copying.
 */
const MAILTO_BODY_LIMIT = 1800;

export function enquiryMailtoHref(draft: EnquiryDraft): string {
  let body = enquiryText(draft);
  if (body.length > MAILTO_BODY_LIMIT) body = `${body.slice(0, MAILTO_BODY_LIMIT)}…`;
  const params = [
    `subject=${encodeURIComponent(enquirySubject(draft.focus, draft.reference))}`,
    `body=${encodeURIComponent(body)}`,
  ];
  return `mailto:${site.email}?${params.join("&")}`;
}
