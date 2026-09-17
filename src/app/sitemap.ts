import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { absoluteUrl } from "@/lib/seo";

/**
 * Generated from the same content the pages are built from, so a new service
 * page cannot be shipped without appearing in the sitemap.
 *
 * /start is included (it is a real, linkable page); the API route is not.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/system-lab"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/work"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/approach"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/start"), lastModified: now, changeFrequency: "yearly", priority: 0.9 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: absoluteUrl(`/${service.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...core, ...servicePages];
}
