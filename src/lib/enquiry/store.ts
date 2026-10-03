/**
 * DURABLE CAPTURE — the only thing a submission is allowed to depend on.
 *
 * An inquiry is written here before the visitor is told it arrived. Everything
 * else that happens to it — the email notification, anything added later — is
 * a consequence of the record existing, never a precondition of it.
 *
 * That ordering is the whole design. The production form was previously
 * reporting failure for every submission because delivery *was* the capture:
 * with no SMTP credentials configured, the adapter refused to run and the
 * inquiry died with it. Nothing was stored, so nothing could be recovered.
 *
 * Two stores, tried in this order:
 *
 *   Google Sheets  one row per inquiry in the studio's own sheet, via the
 *                  Apps Script web app (ENQUIRY_SHEET_URL). See sheet.ts.
 *   Vercel Blob    private JSON files, if a Blob store is connected. Private
 *                  matters: an inquiry contains a name, an email address and
 *                  whatever the person chose to tell us.
 */

import { put } from "@vercel/blob";
import { site } from "@/content/site";
import { serverEnv } from "@/lib/env";
import type { EnquiryRecord } from "./adapter";
import { appendToSheet } from "./sheet";

/** Where an inquiry ended up, for the log line and the notification. */
export interface StoredEnquiry {
  readonly pathname: string;
  readonly storedAt: string;
}

/**
 * Two-digit months and a timestamped filename, so the store sorts
 * chronologically in the dashboard and two inquiries in the same second
 * cannot overwrite each other.
 */
function pathFor(record: EnquiryRecord): string {
  const at = new Date(record.receivedAt);
  const year = at.getUTCFullYear();
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const stamp = at.toISOString().replace(/[:.]/g, "-");
  return `enquiries/${year}/${month}/${stamp}__${record.reference}.json`;
}

/**
 * Writes the inquiry and returns where it went. Throws if it did not store,
 * which the route turns into the visitor-facing failure state — the one case
 * where telling someone "received" would be a lie.
 */
export async function persistEnquiry(record: EnquiryRecord): Promise<StoredEnquiry> {
  const env = serverEnv();

  if (env.ENQUIRY_SHEET_URL) {
    const { row } = await appendToSheet(record, {
      url: env.ENQUIRY_SHEET_URL,
      secret: env.ENQUIRY_SHEET_SECRET,
      source: `${new URL(site.url).host}/start`,
    });
    return { pathname: `sheet row ${row}`, storedAt: new Date().toISOString() };
  }

  const token = env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    // Outside a configured deployment there is nowhere durable to write. Say
    // so loudly rather than accepting the inquiry into nothing.
    throw new Error(
      "No durable store is configured (set ENQUIRY_SHEET_URL, or connect a " +
        "Vercel Blob store) — see integrations/google-sheets/README.md.",
    );
  }

  const pathname = pathFor(record);

  // Every field the visitor submitted, plus when it arrived and what it is
  // called. Nothing is summarised away: this file is the inquiry.
  const body = JSON.stringify(
    {
      reference: record.reference,
      receivedAt: record.receivedAt,
      focus: record.focus,
      answers: record.answers,
      name: record.name,
      email: record.email,
      company: record.company ?? null,
      website: record.website ?? null,
      message: record.message ?? null,
      consent: record.consent,
      source: "velabuilt.com/start",
    },
    null,
    2,
  );

  const result = await put(pathname, body, {
    access: "private",
    token,
    contentType: "application/json",
    // The pathname already carries a timestamp and a reference; a random
    // suffix would only make the record harder to find again.
    addRandomSuffix: false,
  });

  return { pathname: result.pathname, storedAt: new Date().toISOString() };
}
