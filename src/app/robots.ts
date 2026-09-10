import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Open to crawlers, including AI crawlers.
 *
 * VelaBuilt's discoverability offer rests on being readable by search engines
 * and answer engines alike, so blocking them here would be incoherent. The
 * only disallowed path is the enquiry endpoint, which is a POST-only API and
 * has nothing to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
