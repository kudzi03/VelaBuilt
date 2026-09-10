/**
 * INBOUND ENQUIRY ADAPTERS — the integration boundary.
 *
 * This is a deliberately separate inbound path. It does not touch, read from
 * or write to the existing VelaBuilt Acquisition OS, and it does not call the
 * existing W1–W5 outbound workflows. A future integration is added by writing
 * a new adapter here; no other file needs to change.
 *
 * WHERE FUTURE INTEGRATIONS CONNECT
 * ---------------------------------------------------------------------------
 *  CRM        implement `deliver()` → create Contact + Opportunity, return id
 *  Airtable   implement `deliver()` → POST to a *dedicated inbound base*,
 *             using a PAT scoped to that base only, held server-side
 *  n8n        implement `deliver()` → POST to a NEW inbound webhook workflow
 *             (W-IN-01), never an existing outbound workflow
 *  Email      implement `deliver()` → transactional send to ENQUIRY_NOTIFY_EMAIL
 *  Calendar   post-delivery step → return a booking URL in `bookingUrl`
 *
 * RULES FOR ANY ADAPTER ADDED HERE
 *   1. Runs server-side only. Credentials come from `serverEnv()`.
 *   2. Never logs `email`, `message` or any free text at info level.
 *   3. Failure to deliver must not lose the enquiry: throw, and let the route
 *      decide what the visitor sees.
 *   4. Outbound requests are time-boxed. A hanging integration is an outage.
 */

import { serverEnv } from "@/lib/env";
import type { EnquiryInput } from "./schema";

export interface EnquiryRecord extends EnquiryInput {
  /** Server-generated. Safe to show a visitor; contains no personal data. */
  readonly reference: string;
  readonly receivedAt: string;
}

export interface DeliveryResult {
  /** Adapter that handled it, for diagnostics. */
  readonly via: string;
  /** Optional booking link offered after a qualified submission. */
  readonly bookingUrl?: string;
}

export interface EnquiryAdapter {
  readonly name: string;
  deliver(record: EnquiryRecord): Promise<DeliveryResult>;
}

const OUTBOUND_TIMEOUT_MS = 8_000;

/**
 * Default adapter. Records that an enquiry arrived, with nothing personal in
 * the log line — reference, focus and shape only.
 */
const logAdapter: EnquiryAdapter = {
  name: "log",
  async deliver(record) {
    console.info("[enquiry] received", {
      reference: record.reference,
      focus: record.focus,
      answerCount: Object.keys(record.answers).length,
      hasCompany: Boolean(record.company),
      hasMessage: Boolean(record.message),
      receivedAt: record.receivedAt,
    });
    return { via: "log" };
  },
};

/**
 * Signed server-to-server webhook. The secret never leaves the server, and
 * the signature lets the receiver reject anything not sent by this site.
 */
const webhookAdapter: EnquiryAdapter = {
  name: "webhook",
  async deliver(record) {
    const env = serverEnv();
    const url = env.ENQUIRY_WEBHOOK_URL;
    if (!url) throw new Error("Webhook adapter selected without a URL");

    const body = JSON.stringify({
      reference: record.reference,
      receivedAt: record.receivedAt,
      focus: record.focus,
      answers: record.answers,
      contact: {
        name: record.name,
        email: record.email,
        company: record.company ?? null,
        website: record.website ?? null,
      },
      message: record.message ?? null,
      source: "velabuilt.com/start",
    });

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "user-agent": "velabuilt-site/1.0",
    };

    if (env.ENQUIRY_WEBHOOK_SECRET) {
      headers["x-velabuilt-signature"] = await sign(
        body,
        env.ENQUIRY_WEBHOOK_SECRET,
      );
      headers["x-velabuilt-timestamp"] = record.receivedAt;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OUTBOUND_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Enquiry webhook responded ${response.status}`);
      }
      return { via: "webhook" };
    } finally {
      clearTimeout(timer);
    }
  },
};

/** HMAC-SHA256 over the exact bytes sent, using Web Crypto. */
async function sign(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getEnquiryAdapter(): EnquiryAdapter {
  return serverEnv().ENQUIRY_ADAPTER === "webhook" ? webhookAdapter : logAdapter;
}

/** Human-quotable, non-guessable, and free of personal data. */
export function createReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = [...bytes]
    .map((byte) => byte.toString(36).toUpperCase().padStart(2, "0"))
    .join("")
    .slice(0, 6);
  const year = new Date().getUTCFullYear();
  return `VB-${year}-${suffix}`;
}
