import { NextResponse } from "next/server";
import { enquirySchema, screenSubmission } from "@/lib/enquiry/schema";
import {
  createReference,
  getEnquiryAdapter,
  type EnquiryRecord,
} from "@/lib/enquiry/adapter";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Inbound enquiry endpoint.
 *
 * This route is the only server surface the marketing site exposes. It is
 * deliberately isolated from every existing VelaBuilt workflow: it validates,
 * screens, references and hands off to an adapter, and it knows nothing about
 * any production system beyond the one URL an adapter is configured with.
 *
 * Ordering matters and is intentional:
 *   1. method + content type      cheapest rejections first
 *   2. body size cap              before parsing
 *   3. rate limit                 before schema work
 *   4. schema validation          before any business logic
 *   5. bot screening              silent, uninformative
 *   6. delivery                   time-boxed, never leaks internals
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** Deliberately uninformative to a prober; specific enough for a person. */
const GENERIC_ERROR =
  "We could not process that. Please try again, or email hello@velabuilt.com.";

function json(body: unknown, status: number, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ message: GENERIC_ERROR }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ message: "That message is too long to send." }, 413);
  }

  const key = clientKey(request.headers);
  const limit = rateLimit(`enquiry:${key}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return json(
      { message: "That is a few too many enquiries. Please try again shortly." },
      429,
      { "retry-after": String(limit.retryAfter) },
    );
  }

  let raw: unknown;
  try {
    const text = await request.text();
    // Guard against a body larger than its declared content-length.
    if (text.length > MAX_BODY_BYTES) {
      return json({ message: "That message is too long to send." }, 413);
    }
    raw = JSON.parse(text);
  } catch {
    return json({ message: GENERIC_ERROR }, 400);
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
    return json({ message: "Please check the highlighted fields.", fieldErrors }, 422);
  }

  const input = parsed.data;

  // Bot screening: accepted-looking response, nothing delivered, nothing learnt.
  const verdict = screenSubmission(input);
  if (!verdict.accepted) {
    return json({ reference: createReference(), received: true }, 202);
  }

  const record: EnquiryRecord = {
    ...input,
    reference: createReference(),
    receivedAt: new Date().toISOString(),
  };

  try {
    const adapter = getEnquiryAdapter();
    const result = await adapter.deliver(record);

    return json(
      {
        received: true,
        reference: record.reference,
        ...(result.bookingUrl ? { bookingUrl: result.bookingUrl } : {}),
      },
      201,
    );
  } catch (error) {
    // Log the failure, never the enquiry contents.
    console.error("[enquiry] delivery failed", {
      reference: record.reference,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return json(
      {
        message:
          "We received that but could not file it automatically. Please email hello@velabuilt.com so nothing is lost.",
      },
      502,
    );
  }
}

/** Everything else is explicitly not allowed. */
export async function GET(): Promise<Response> {
  return json({ message: "Method not allowed" }, 405, { allow: "POST" });
}
