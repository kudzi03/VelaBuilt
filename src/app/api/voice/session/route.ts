/**
 * MINTING A CONVERSATION.
 *
 * The browser never sees an ElevenLabs API key. It asks this route for a
 * session and gets back one of:
 *
 *   { kind: "token",  token }     a short-lived WebRTC conversation token,
 *                                 minted with the key — used whenever
 *                                 ELEVENLABS_API_KEY is configured
 *   { kind: "signed", signedUrl } a signed WebSocket URL, if the token
 *                                 endpoint refuses but signing works
 *   { kind: "public", agentId }   the agent id alone, which is public by
 *                                 design (it is what the official widget
 *                                 puts in the page) — the fallback while no
 *                                 key is configured. The agent's allowlist
 *                                 restricts which origins may use it.
 *
 * Why a route rather than a constant: the key stays server-side, Vela can be
 * switched off by unsetting one variable, and a script hammering this
 * endpoint is refused here rather than at ElevenLabs' expense.
 */

import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
/** Sessions are per-visitor and short-lived; nothing here may be cached. */
export const dynamic = "force-dynamic";

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID?.trim();
const API_KEY = process.env.ELEVENLABS_API_KEY?.trim();
const API = "https://api.elevenlabs.io/v1/convai/conversation";

const noStore = { "cache-control": "no-store" };

export async function POST(request: Request): Promise<NextResponse> {
  if (!AGENT_ID) {
    // Not an error state: Vela is simply not configured on this deployment.
    return NextResponse.json({ error: "guide_unavailable" }, { status: 503, headers: noStore });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // A conversation costs real credits. Six a minute is far more than a person
  // needs and far less than a script can profit from.
  const limit = rateLimit(`voice:${ip}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfter) } },
    );
  }

  if (!API_KEY) {
    return NextResponse.json({ kind: "public", agentId: AGENT_ID }, { headers: noStore });
  }

  const id = encodeURIComponent(AGENT_ID);
  const headers = { "xi-api-key": API_KEY };

  try {
    const res = await fetch(`${API}/token?agent_id=${id}`, { headers, cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { token?: string };
      if (data.token) return NextResponse.json({ kind: "token", token: data.token }, { headers: noStore });
    }
    const signed = await fetch(`${API}/get-signed-url?agent_id=${id}`, { headers, cache: "no-store" });
    if (signed.ok) {
      const data = (await signed.json()) as { signed_url?: string };
      if (data.signed_url) {
        return NextResponse.json({ kind: "signed", signedUrl: data.signed_url }, { headers: noStore });
      }
    }
    console.warn("[velabuilt] voice credentials refused:", res.status, signed.status);
  } catch (e) {
    console.warn("[velabuilt] voice credential mint failed:", e);
  }
  // The key can fail (revoked, wrong workspace) without the agent being
  // private; the public id is still the honest fallback.
  return NextResponse.json({ kind: "public", agentId: AGENT_ID }, { headers: noStore });
}
