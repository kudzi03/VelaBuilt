import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { EnquiryDialogProvider } from "@/components/enquiry/EnquiryDialogProvider";
import { site } from "@/content/site";
import { BASE_URL } from "@/lib/seo";
import { graph, organizationSchema, webSiteSchema } from "@/lib/schema";
import "./globals.css";

/**
 * Refined serif against a precise modern sans — the identity's core type
 * contrast. Both are self-hosted at build time by next/font: no runtime
 * request to a font CDN, no layout shift from a late swap.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
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
    <html lang="en-GB" className={`${cormorant.variable} ${inter.variable}`}>
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
