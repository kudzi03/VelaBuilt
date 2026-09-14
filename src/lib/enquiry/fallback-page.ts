/**
 * NO-JAVASCRIPT FAILURE PAGE.
 *
 * Only a visitor whose browser posted the form natively ever sees this, and
 * only when the enquiry could not be delivered or accepted. Its one job is to
 * make sure nothing they wrote is lost: it offers the enquiry as a pre-filled
 * email and shows the full text to copy.
 *
 * Self-contained HTML on purpose. It must render even when the reason for the
 * failure is the application itself, so it depends on no bundle, font or
 * stylesheet. Every interpolated value is escaped.
 */

import { site } from "@/content/site";
import { enquiryMailtoHref, enquiryText, type EnquiryDraft } from "./format";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Field-level problems a person can act on; anything else stays generic. */
const FIELD_HINTS: Record<string, string> = {
  focus: "Choose what you are trying to improve.",
  name: "Please tell us who you are.",
  email: "Please give us an email we can reply to.",
  consent: "Please confirm we can reply to you.",
};

export function fieldHints(paths: readonly string[]): string[] {
  const hints = new Set<string>();
  for (const path of paths) {
    const hint = FIELD_HINTS[path.split(".")[0] ?? ""];
    if (hint) hints.add(hint);
  }
  return [...hints];
}

export function renderFallbackPage({
  status,
  message,
  hints = [],
  draft,
}: {
  readonly status: number;
  readonly message: string;
  readonly hints?: readonly string[];
  readonly draft: EnquiryDraft;
}): Response {
  const text = enquiryText(draft);
  const mailto = enquiryMailtoHref(draft);

  const html = `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Start a project — ${escapeHtml(site.name)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #050506; color: #f2efe9; font: 300 1rem/1.65 Inter, system-ui, sans-serif; }
  main { max-width: 40rem; margin: 0 auto; padding: 4rem 1.5rem 5rem; }
  .label { font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; color: #e0c398; }
  h1 { font: 400 clamp(2rem, 6vw, 2.8rem)/1.1 "Cormorant Garamond", Georgia, serif; margin: 1.25rem 0 1.5rem; }
  p { color: #c9c5bd; }
  ul { color: #c9c5bd; padding-left: 1.2rem; }
  .btn { display: inline-block; margin: 1.5rem 0 0; padding: 0.95rem 1.6rem; background: #f2efe9; color: #050506; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none; }
  .btn:focus-visible, a:focus-visible { outline: 2px solid #e0c398; outline-offset: 3px; }
  pre { margin: 1rem 0 0; padding: 1.1rem; white-space: pre-wrap; word-break: break-word; background: rgb(255 255 255 / 0.03); border: 1px solid rgb(255 255 255 / 0.16); color: #f2efe9; font: 0.9rem/1.6 ui-monospace, monospace; }
  a { color: #e0c398; }
  hr { border: 0; border-top: 1px solid rgb(255 255 255 / 0.09); margin: 2.5rem 0; }
</style>
</head>
<body>
<main>
  <p class="label">Start a project</p>
  <h1>That did not send.</h1>
  <p role="alert">${escapeHtml(message)}</p>
  ${hints.length > 0 ? `<ul>${hints.map((hint) => `<li>${escapeHtml(hint)}</li>`).join("")}</ul>` : ""}
  <a class="btn" href="${escapeHtml(mailto)}">Email it to ${escapeHtml(site.email)}</a>
  ${
    text
      ? `<hr><p class="label">Your inquiry</p><pre>${escapeHtml(text)}</pre>`
      : ""
  }
  <hr>
  <p>Go back to change your answers and try again, or <a href="/start">start the form again</a>.</p>
</main>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
