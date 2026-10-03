/**
 * DURABLE CAPTURE IN GOOGLE SHEETS.
 *
 * Each inquiry becomes one row in the studio's own sheet, appended by the
 * Apps Script in integrations/google-sheets/Code.gs (deployed as a web app
 * that runs as the sheet's owner). No Google credentials live here: the site
 * knows the web-app URL and a shared secret, and nothing else.
 *
 * The append only counts when the script answers `{ ok: true }`. Anything
 * else — a timeout, an HTML error page, a wrong secret, a sheet that was
 * deleted — throws, and the route tells the visitor it did not send.
 */

import { focusLabel, labelForAnswer, stepsForFocus } from "@/content/enquiry-flow";
import type { EnquiryRecord } from "./adapter";

/** The columns, in order. The script writes this as the header row. */
export const SHEET_COLUMNS = [
  "Received (UTC)",
  "Reference",
  "Focus",
  "Answers",
  "Name",
  "Email",
  "Company",
  "Website",
  "Message",
  "Source",
] as const;

const SHEET_TIMEOUT_MS = 12_000;

/**
 * A cell that starts with = + - @ (or a tab / carriage return) is read by
 * Sheets as a formula. Visitor text must never be executable in the studio's
 * own spreadsheet, so such values are stored as literal text.
 */
export function literal(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** One row, as plain strings, in SHEET_COLUMNS order. */
export function sheetRow(record: EnquiryRecord, source: string): string[] {
  const answers = stepsForFocus(record.focus)
    .filter((step) => record.answers[step.id]?.length)
    .map((step) => {
      const values = record.answers[step.id]!.map((v) => labelForAnswer(step.id, v));
      return `${step.question} ${values.join(", ")}`;
    })
    .join("\n");

  return [
    record.receivedAt.replace("T", " ").replace(/\.\d+Z$/, ""),
    record.reference,
    focusLabel[record.focus],
    answers,
    record.name,
    record.email,
    record.company ?? "",
    record.website ?? "",
    record.message ?? "",
    source,
  ].map(literal);
}

interface ScriptReply {
  readonly ok?: unknown;
  readonly row?: unknown;
  readonly error?: unknown;
}

function parseReply(text: string): ScriptReply | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" ? (value as ScriptReply) : null;
  } catch {
    return null;
  }
}

/** Appends the inquiry. Resolves with the row number; throws otherwise. */
export async function appendToSheet(
  record: EnquiryRecord,
  config: { url: string; secret: string | undefined; source: string },
): Promise<{ row: number }> {
  if (!config.secret) {
    throw new Error("ENQUIRY_SHEET_URL is set but ENQUIRY_SHEET_SECRET is not");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS);

  try {
    // Apps Script answers a POST with a 302 to the rendered result; following
    // it (as a GET, per spec) is how the response body is read.
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        secret: config.secret,
        columns: SHEET_COLUMNS,
        row: sheetRow(record, config.source),
      }),
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    const reply = parseReply(await response.text());

    if (!response.ok || !reply || reply.ok !== true) {
      const reason =
        reply && typeof reply.error === "string"
          ? reply.error
          : `HTTP ${response.status}, ${reply ? "no ok flag" : "not JSON"}`;
      throw new Error(`Sheet append refused: ${reason}`);
    }

    return { row: typeof reply.row === "number" ? reply.row : -1 };
  } finally {
    clearTimeout(timer);
  }
}
