import type { NextConfig } from "next";
import { resolveSiteOrigin } from "./src/lib/site-origin";

/**
 * CANONICAL ORIGIN
 *
 * Resolved once, here, and inlined into every bundle below as
 * NEXT_PUBLIC_SITE_URL — so server and client code can never disagree about
 * the host. See src/lib/site-origin.ts for the precedence rules.
 */
const canonical = resolveSiteOrigin(process.env);

/**
 * LEGACY HOST → CANONICAL HOST (301)
 *
 * Off by default. Turn on with CANONICAL_HOST_REDIRECT=1 only after the
 * canonical domain serves this deployment (DOMAIN-SETUP.md, step 5). Redirects
 * are compiled at build time, so changing the flag needs a redeploy.
 *
 * Guards:
 *   · Requires NEXT_PUBLIC_SITE_URL to be set explicitly. Redirecting to a
 *     fallback origin would be redirecting to a guess.
 *   · Never redirects a host to itself.
 *   · /api/* is exempt. A 301 turns a POST into a GET, so an enquiry sent from
 *     a page still open on the old host would be lost rather than delivered.
 *
 * CANONICAL_REDIRECT_FROM overrides the legacy host list (comma-separated).
 */
const LEGACY_HOSTS = ["vela-built.vercel.app"];

function legacyHostRedirects() {
  if (process.env.CANONICAL_HOST_REDIRECT !== "1") return [];

  if (canonical.source !== "NEXT_PUBLIC_SITE_URL") {
    throw new Error(
      "CANONICAL_HOST_REDIRECT=1 requires NEXT_PUBLIC_SITE_URL to be set explicitly.",
    );
  }

  const canonicalHost = new URL(canonical.origin).host;
  const fromHosts = (process.env.CANONICAL_REDIRECT_FROM?.split(",") ?? LEGACY_HOSTS)
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host && host !== canonicalHost);

  return fromHosts.map((host) => ({
    source: "/:path((?!api/).*)",
    has: [{ type: "host" as const, value: host.replaceAll(".", "\\.") }],
    destination: `${canonical.origin}/:path`,
    statusCode: 301 as const,
  }));
}

/**
 * SECURITY HEADERS
 *
 * Applied to every response. See SECURITY.md for the reasoning behind the
 * Content-Security-Policy compromise on `script-src` and the exact upgrade
 * path to a nonce-based policy.
 *
 * Notes on specific directives:
 *   script-src  'unsafe-inline' is required by the App Router's inline
 *               bootstrap and streaming payload on statically rendered pages.
 *               React escapes all interpolated values and this site renders no
 *               user-generated content, so the practical XSS surface is the
 *               enquiry confirmation — which echoes nothing the visitor typed.
 *   style-src   'unsafe-inline' is required by React inline styles and the
 *               critical CSS Next inlines.
 *   worker-src  blob: — three.js / drei asset loaders create worker blobs.
 *   font-src    'self' only: fonts are self-hosted by next/font at build time,
 *               so no third-party font origin is ever contacted at runtime.
 */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS is only meaningful over HTTPS; harmless and inert in local dev.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  env: { NEXT_PUBLIC_SITE_URL: canonical.origin },

  // Type errors must fail the build, never be silently ignored. Next 16 no
  // longer lints during build, so `npm run build` runs `npm run lint` first
  // (package.json) — which is what fails a deploy on a typography regression.
  typescript: { ignoreBuildErrors: false },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    // three.js and drei are large; import only what each page uses.
    optimizePackageImports: ["@react-three/drei", "three", "motion"],
  },

  async redirects() {
    return legacyHostRedirects();
  },

  async headers() {
    // Build output is already served immutable and content-hashed by Next;
    // adding our own Cache-Control there only risks breaking dev.
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
