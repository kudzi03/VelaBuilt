/**
 * SEO is architectural here, not decorative.
 *
 * Every route builds its metadata through `pageMetadata`, so canonical URLs,
 * OpenGraph, Twitter cards and titles cannot drift apart or be forgotten.
 */

import type { Metadata } from "next";
import { site } from "@/content/site";

export const BASE_URL = site.url;

export function absoluteUrl(path = "/"): string {
  return new URL(path, BASE_URL).toString();
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path, always starting with "/". Becomes the canonical URL. */
  path: string;
  /** Omit the "| VelaBuilt" suffix — used by the homepage only. */
  bareTitle?: boolean;
  noIndex?: boolean;
}

export function pageMetadata({
  title,
  description,
  path,
  bareTitle = false,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = bareTitle ? title : `${title} — ${site.name}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      url,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export interface Crumb {
  readonly name: string;
  readonly path: string;
}
