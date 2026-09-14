/**
 * CANONICAL ORIGIN — the single source of truth for the site's host.
 *
 * Resolved exactly once, at build time, by next.config.ts, which inlines the
 * result into every bundle as `process.env.NEXT_PUBLIC_SITE_URL`. Server and
 * client code therefore read the same value, and metadataBase, canonical
 * links, og:url, robots.txt, sitemap.xml and every JSON-LD `@id` / `url`
 * derive from it through `site.url` (src/content/site.ts).
 *
 * This module has no imports so next.config.ts can load it directly.
 *
 * Precedence:
 *   1. NEXT_PUBLIC_SITE_URL, when set. The only way a custom domain becomes
 *      canonical — it must be a deliberate choice, made after that domain
 *      actually serves this site (see DOMAIN-SETUP.md).
 *   2. On Vercel, the project's production *.vercel.app domain. An
 *      unconfigured deployment canonicalises to a host that really serves it.
 *   3. Anywhere else (local dev, `next build` on a laptop), localhost.
 *
 * What it refuses to do: guess. If a custom domain is attached to the Vercel
 * project but NEXT_PUBLIC_SITE_URL is unset, the build fails. Vercel reports
 * an attached domain as the production URL whether or not its DNS points here
 * yet, and silently trusting that is exactly how every canonical on this site
 * came to point at a parked domain.
 */

export type SiteOriginSource =
  | "NEXT_PUBLIC_SITE_URL"
  | "VERCEL_PROJECT_PRODUCTION_URL"
  | "localhost";

export interface ResolvedSiteOrigin {
  readonly origin: string;
  readonly source: SiteOriginSource;
}

type Env = Readonly<Record<string, string | undefined>>;

const LOCAL_ORIGIN = "http://localhost:3000";

function toOrigin(raw: string, name: string): string {
  // Tolerate a bare host ("example.com"); everything else must parse.
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${name} is not a valid URL: "${raw}"`);
  }
  // Round-tripping through URL means a trailing slash or a stray path can
  // never reach a canonical tag, a sitemap entry or an OG URL.
  return url.origin;
}

export function resolveSiteOrigin(env: Env): ResolvedSiteOrigin {
  // The bundler substitutes an empty string for an absent NEXT_PUBLIC_*
  // variable, so empty is treated as unset rather than as a value.
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return {
      origin: toOrigin(explicit, "NEXT_PUBLIC_SITE_URL"),
      source: "NEXT_PUBLIC_SITE_URL",
    };
  }

  const vercelProduction = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (env.VERCEL && vercelProduction) {
    const origin = toOrigin(vercelProduction, "VERCEL_PROJECT_PRODUCTION_URL");
    if (new URL(origin).hostname.endsWith(".vercel.app")) {
      return { origin, source: "VERCEL_PROJECT_PRODUCTION_URL" };
    }
    throw new Error(
      `This Vercel project has a custom production domain (${origin}) but ` +
        "NEXT_PUBLIC_SITE_URL is not set. Set NEXT_PUBLIC_SITE_URL to the " +
        "canonical origin once that domain serves this site — see " +
        "DOMAIN-SETUP.md. The build will not guess.",
    );
  }

  return { origin: LOCAL_ORIGIN, source: "localhost" };
}
