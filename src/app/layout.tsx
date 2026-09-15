import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { EnquiryDialogProvider } from "@/components/enquiry/EnquiryDialogProvider";
import { site } from "@/content/site";
import { BASE_URL } from "@/lib/seo";
import { graph, organizationSchema, webSiteSchema } from "@/lib/schema";
import "./globals.css";

/**
 * Refined serif against a precise modern sans — the identity's core type
 * contrast. Self-hosted from src/app/fonts: no runtime request to a font CDN,
 * no layout shift from a late swap (next/font generates metric-matched
 * fallbacks).
 *
 * Only the faces the design renders are registered. Measured across every
 * route, both viewports, the dialog and the mobile menu, text uses Inter at
 * 300–600 and Cormorant Garamond at 300, upright and italic. Registering every
 * weight × every unicode subset had put 60 @font-face rules on each page; this
 * is 3 faces, plus the 2 metric-matched fallbacks next/font adds. See
 * src/app/fonts/README.md for how the files were produced.
 */
const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-300-latin.woff2", weight: "300", style: "normal" },
    { path: "./fonts/cormorant-garamond-300-italic-latin.woff2", weight: "300", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
  // The fallback next/font/google chose for a serif, so a swap moves nothing.
  adjustFontFallback: "Times New Roman",
});

const inter = localFont({
  src: [{ path: "./fonts/inter-latin.woff2", weight: "300 600", style: "normal" }],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s`,
  },
  description: site.shortDescription,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
  // Icon and manifest links come from the app/ file conventions
  // (icon.svg, manifest.ts) — declaring them here too would duplicate the tags.
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Never trap a visitor at a zoom level they did not choose.
  maximumScale: 5,
};

/** Site-wide entity graph. Page-level graphs add Service, FAQ and breadcrumbs. */
const siteGraph = graph([organizationSchema(), webSiteSchema()]);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        {/*
         * Marks the document as scripted before first paint. Section entrance
         * animations start from "hidden" only when this class is present, so a
         * visitor without JavaScript — or with it broken — gets the whole page
         * as ordinary visible content rather than a blank one. Inline and in
         * <head> deliberately: anything later would flash.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js")`,
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-6 focus-visible:top-6 focus-visible:z-[100] focus-visible:bg-[color:var(--color-ivory)] focus-visible:px-5 focus-visible:py-3 focus-visible:text-xs focus-visible:uppercase focus-visible:tracking-[0.2em] focus-visible:text-[color:var(--color-void)]"
        >
          Skip to content
        </a>

        <EnquiryDialogProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </EnquiryDialogProvider>

        <script
          type="application/ld+json"
          // Server-generated from typed content; contains no user input.
          dangerouslySetInnerHTML={{ __html: siteGraph }}
        />
      </body>
    </html>
  );
}
