import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { VelaStage } from "@/vela/VelaStage";
import { VelaStill } from "@/vela/VelaStill";
import { Hud } from "@/components/chrome/Hud";
import { VoiceRoot } from "@/voice/VoiceRoot";
import { EnquiryDialogProvider } from "@/components/enquiry/EnquiryDialogProvider";
import { site } from "@/content/site";
import { BASE_URL } from "@/lib/seo";
import { graph, organizationSchema, webSiteSchema } from "@/lib/schema";
import "./globals.css";

/**
 * Two families, self-hosted from src/app/fonts (see the README there).
 *
 *   Archivo      one variable file carrying weight (300–600) and width
 *                (100–125%). Expanded uppercase for display, normal width
 *                for reading — one family doing the work of two.
 *   Geist Mono   labels, counters, controls. The instrument voice.
 *
 * next/font generates metric-matched fallbacks, so a late swap moves nothing.
 */
const archivo = localFont({
  src: [{ path: "./fonts/archivo-var.woff2", weight: "300 600", style: "normal" }],
  variable: "--font-archivo",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
  declarations: [{ prop: "font-stretch", value: "100% 125%" }],
});

const geistMono = localFont({
  src: [{ path: "./fonts/geistmono-var.woff2", weight: "400 500", style: "normal" }],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
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
  themeColor: "#efebe5",
  colorScheme: "light",
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
    <html lang="en-US" className={`${archivo.variable} ${geistMono.variable}`}>
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

        <VelaStage still={<VelaStill />} />
        <EnquiryDialogProvider>
          <div className="site">
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </div>
          <Hud />
          <VoiceRoot />
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
