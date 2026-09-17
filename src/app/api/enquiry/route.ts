import { NextResponse } from "next/server";
import { FOCUS_OPTIONS, type Focus } from "@/content/enquiry-flow";
import { enquirySchema, screenSubmission } from "@/lib/enquiry/schema";
import {
  createReference,
  getEnquiryAdapter,
  type EnquiryRecord,
} from "@/lib/enquiry/adapter";
import { formToEnquiry } from "@/lib/enquiry/form";
import { fieldHints, renderFallbackPage } from "@/lib/enquiry/fallback-page";
import type { EnquiryDraft } from "@/lib/enquiry/format";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { persistEnquiry } from "@/lib/enquiry/store";
import { site } from "@/content/site";

/**
 * Inbound enquiry endpoint.
 *
 * This route is the only server surface the marketing site exposes. It is
 * deliberately isolated from every existing VelaBuilt workflow: it validates,
 * screens, references and hands off to an adapter, and it knows nothing about
 * any production system beyond the one URL an adapter is configured with.
 *
 * Two callers, one contract:
 *   json   the enhanced form's fetch(). Answers with JSON status codes.
 *   form   a native <form method="post"> — the no-JavaScript path. Success is
 *          a 303 to /start?sent=<reference> (post/redirect/get, so a refresh
 *          cannot resend); failure is a self-contained page that offers the
 *          enquiry as a pre-filled email so nothing is lost.
 *
 * Ordering matters and is intentional:
 *   1. method + content type      cheapest rejections first
 *   2. body size cap              before parsing
 *   3. same-origin (form only)    a native form post is a CSRF-able request
 *   4. rate limit                 before schema work
 *   5. schema validation          before any business logic
 *   6. bot screening              silent, uninformative
 *   7. delivery                   time-boxed, never leaks internals
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** Deliberately uninformative to a prober; specific enough for a person. */
const GENERIC_ERROR =
  `We could not process that. Please try again, or email ${site.email}.`;
const TOO_LONG = "That message is too long to send.";
const TOO_MANY = "That is a few too many inquiries. Please try again shortly.";
const NOT_FILED =
  `That didn’t send. Your answers are still here. Try again, or email them directly to ${site.email}.`;

type Mode = "json" | "form";

function json(body: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

/** Rebuilds what the visitor sent, loosely, for the fallback page. */
function draftFrom(raw: unknown): EnquiryDraft {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const text = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string).slice(0, 2000) : undefined;
  const focus = FOCUS_OPTIONS.includes(value.focus as Focus) ? (value.focus as Focus) : null;
  const answers =
    value.answers && typeof value.answers === "object"
      ? (value.answers as Record<string, string[]>)
      : {};
  return {
    focus,
    answers,
    name: text("name"),
    email: text("email"),
    company: text("company"),
    website: text("website"),
    message: text("message"),
  };
}

function failure(
  mode: Mode,
  status: number,
  message: string,
  options: { raw?: unknown; fieldErrors?: Record<string, string>; headers?: HeadersInit } = {},
): Response {
  if (mode === "json") {
    return json(
      options.fieldErrors ? { message, fieldErrors: options.fieldErrors } : { message },
      status,
      options.headers,
    );
  }
  const response = renderFallbackPage({
    status,
    message,
    hints: fieldHints(Object.keys(options.fieldErrors ?? {})),
    draft: draftFrom(options.raw),
  });
  for (const [key, value] of new Headers(options.headers)) {
    response.headers.set(key, value);
  }
  return response;
}

function sent(mode: Mode, reference: string, status: number, extra: object = {}): Response {
  if (mode === "json") return json({ received: true, reference, ...extra }, status);
  // Relative Location is valid (RFC 9110) and survives any proxy's host.
  return new Response(null, {
    status: 303,
    headers: {
      location: `/start?sent=${encodeURIComponent(reference)}`,
      "cache-control": "no-store",
    },
  });
}

/**
 * A native form post is a "simple" request any site can make. Refuse one the
 * browser marks as cross-site. JSON is safe already: a cross-origin
 * application/json POST needs a CORS preflight this route never grants.
 */
function isCrossSite(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  // Behind a proxy the public host arrives as x-forwarded-host.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  const mode: Mode | null = contentType.includes("application/json")
    ? "json"
    : contentType.includes("application/x-www-form-urlencoded")
      ? "form"
      : null;

  if (!mode) {
    return json({ message: GENERIC_ERROR }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return failure(mode, 413, TOO_LONG);
  }

  if (mode === "form" && isCrossSite(request)) {
    return failure(mode, 403, GENERIC_ERROR);
  }

  const key = clientKey(request.headers);
  const limit = rateLimit(`enquiry:${key}`, RATE_LIMIT, RATE_WINDOW_MS);

  let raw: unknown;
  try {
    const text = await request.text();
    // Guard against a body larger than its declared content-length.
    if (text.length > MAX_BODY_BYTES) {
      return failure(mode, 413, TOO_LONG);
    }
    raw = mode === "json" ? JSON.parse(text) : formToEnquiry(new URLSearchParams(text));
  } catch {
    return failure(mode, 400, GENERIC_ERROR);
  }

  // Read before limiting so a throttled no-JS visitor still gets their text back.
  if (!limit.ok) {
    return failure(mode, 429, TOO_MANY, {
      raw,
      headers: { "retry-after": String(limit.retryAfter) },
    });
  }

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    // Field-level messages help a person fix their own input; nothing else
    // about the server's expectations is disclosed.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return failure(mode, 422, "Please check the highlighted fields.", { raw, fieldErrors });
  }

  const input = parsed.data;

  // Bot screening: accepted-looking response, nothing delivered, nothing learnt.
  const verdict = screenSubmission(input);
  if (!verdict.accepted) {
    return sent(mode, createReference(), 202);
  }

  const record: EnquiryRecord = {
    ...input,
    reference: createReference(),
    receivedAt: new Date().toISOString(),
  };

  // 1. Durable capture. This, and only this, decides whether the visitor is
  //    told their inquiry arrived.
  let stored;
  try {
    stored = await persistEnquiry(record);
  } catch (error) {
    // Log the failure, never the inquiry contents.
    console.error("[enquiry] capture failed", {
      reference: record.reference,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return failure(mode, 502, NOT_FILED, { raw: input });
  }

  console.info("[enquiry] captured", {
    reference: record.reference,
    pathname: stored.pathname,
  });

  // 2. Notification. The inquiry is already safe, so a mail server having a
  //    bad day must not turn a captured inquiry into a visible failure — it
  //    turns into a loud log line and a record that can be replayed.
  let bookingUrl: string | undefined;
  try {
    const result = await getEnquiryAdapter().deliver(record);
    bookingUrl = result.bookingUrl;
  } catch (error) {
    console.error("[enquiry] notification failed — inquiry IS stored", {
      reference: record.reference,
      pathname: stored.pathname,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  return sent(mode, record.reference, 201, bookingUrl ? { bookingUrl } : {});
}

/** Everything else is explicitly not allowed. */
export async function GET(): Promise<Response> {
  return json({ message: "Method not allowed" }, 405, { allow: "POST" });
}
