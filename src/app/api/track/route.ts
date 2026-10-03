import { NextResponse } from "next/server";
import { TRACK_EVENTS, TRACK_PARAMS, type TrackPayload } from "@/lib/analytics";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * First-party analytics endpoint. See src/lib/analytics.ts.
 *
 * Accepts a beacon from this site's own pages, keeps only allowlisted events
 * and parameters, and forwards to GA4 via the Measurement Protocol. Responds
 * 204 regardless of outcome — a visitor's page never waits on analytics.
 *
 * Nothing is logged or stored here. The requesting address is used only by
 * the in-memory rate limiter and is never forwarded.
 */

export const runtime = "nodejs";

const MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID ?? "";
const API_SECRET = process.env.GA_API_SECRET ?? "";
const EVENTS = new Set<string>(TRACK_EVENTS);
const PARAMS = new Set<string>(TRACK_PARAMS);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|curl|wget|python|axios|node-fetch/i;

const done = () => new NextResponse(null, { status: 204 });

function deviceCategory(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!MEASUREMENT_ID || !API_SECRET) return done();

  // Only our own pages may report.
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  const self = hostOf(request.url);
  if (!origin || hostOf(origin) !== self) return done();

  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done();

  if (!rateLimit(`track:${clientKey(request.headers)}`, 120, 60_000).ok) return done();

  const text = await request.text();
  if (text.length > 4096) return done();

  let body: TrackPayload;
  try {
    body = JSON.parse(text) as TrackPayload;
  } catch {
    return done();
  }
  if (!body || typeof body.cid !== "string" || !/^\d{1,10}\.\d{1,11}$/.test(body.cid)) return done();
  if (typeof body.sid !== "number" || !EVENTS.has(body.name)) return done();

  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(body.params ?? {})) {
    if (!PARAMS.has(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) params[k] = v;
    else if (typeof v === "string") params[k] = v.slice(0, 300);
  }
  // Page URLs must be ours; strip query strings except campaign tags.
  if (typeof params.page_location === "string") {
    try {
      const u = new URL(params.page_location);
      if (u.hostname !== self) return done();
      const keep = new URLSearchParams();
      for (const [k, v] of u.searchParams) if (/^(utm_\w+|gclid|focus)$/.test(k)) keep.set(k, v);
      u.search = keep.toString();
      u.hash = "";
      params.page_location = u.toString();
    } catch {
      return done();
    }
  }

  params.session_id = body.sid;
  params.engagement_time_msec = 100;
  if (body.first) params.session_start = 1;

  const country = request.headers.get("x-vercel-ip-country") ?? undefined;
  const region = request.headers.get("x-vercel-ip-country-region") ?? undefined;

  const mp = {
    client_id: body.cid,
    timestamp_micros: Date.now() * 1000,
    non_personalized_ads: true,
    ...(country ? { user_location: { country_id: country, ...(region ? { region_id: `${country}-${region}` } : {}) } } : {}),
    device: { category: deviceCategory(ua) },
    events: [
      ...(body.first ? [{ name: "session_start", params: { ...params } }] : []),
      { name: body.name, params },
    ],
  };

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}&api_secret=${encodeURIComponent(API_SECRET)}`,
      { method: "POST", body: JSON.stringify(mp), signal: AbortSignal.timeout(3000) },
    );
  } catch {
    /* analytics must never fail a request */
  }
  return done();
}
