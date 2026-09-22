/**
 * MINTING A CONVERSATION.
 *
 * The browser never sees an ElevenLabs API key. It asks this route for a
 * session and gets back either a short-lived signed URL or — while the agent
 * is configured to accept public connections — the agent id, which is
 * designed to be public and is all the official widget uses.
 *
 * Both shapes are handled by the client, so turning the allowlist on in the
 * ElevenLabs dashboard upgrades this path with no code change. That ordering
 * matters: the alternative is shipping the key in a bundle and discovering it
 * during a security review.
 *
 * ── WHY THIS IS A ROUTE AND NOT A CONSTANT ───────────────────────────────
 *
 * Three things it buys, none of which a hardcoded id gives you:
 *
 *   · the key stays on the server, today and after auth is enabled
 *   · the guide can be switched off site-wide by unsetting one variable,
 *     without a deploy touching the world itself
 *   · a bot hammering the endpoint is refused here rather than at
 *     ElevenLabs' expense
 */

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
/** Sessions are per-visitor and short-lived; nothing here may be cached. */
export const dynamic = "force-dynamic";

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID?.trim();
const API_KEY = process.env.ELEVENLABS_API_KEY?.trim();

export async function POST(request: Request): Promise<NextResponse> {
  if (!AGENT_ID) {
    // Not an error state. The guide is simply not configured on this
    // deployment, and the world is fully usable without it.
    return NextResponse.json({ error: "guide_unavailable" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // A voice session costs real credits, so the limit is tighter than the
  // enquiry form's. Six openings a minute is far more than a person browsing
  // a building will ever need and far less than a script can profit from.
  const limit = rateLimit(`voice:${ip}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // No key: the agent accepts public connections, which is how the widget
  // works. The id is not a secret.
  if (!API_KEY) {
    return NextResponse.json({ kind: "public", agentId: AGENT_ID });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(AGENT_ID)}`,
      { headers: { "xi-api-key": API_KEY }, cache: "no-store" },
    );

    if (!res.ok) {
      // The agent may simply not require auth, in which case the signed-URL
      // endpoint refuses. Falling back to the public id is correct rather
      // than failing the visitor over a configuration detail.
      console.warn("[velabuilt] signed url refused:", res.status);
      return NextResponse.json({ kind: "public", agentId: AGENT_ID });
    }

    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) return NextResponse.json({ kind: "public", agentId: AGENT_ID });

    return NextResponse.json({ kind: "signed", signedUrl: data.signed_url });
  } catch (e) {
    console.warn("[velabuilt] signed url failed:", e);
    return NextResponse.json({ kind: "public", agentId: AGENT_ID });
  }
}
