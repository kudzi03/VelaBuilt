import { ImageResponse } from "next/og";
import { site } from "@/content/site";

/**
 * The social card, generated at build time.
 *
 * Composed from the same palette as the site — deep black, a champagne
 * horizon, and a great deal of space. No photography, no stock imagery, and
 * nothing claimed that the site does not also say.
 */

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050506",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* The champagne horizon. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 330,
            height: 300,
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(224,195,152,0.30) 0%, rgba(142,112,66,0.10) 40%, rgba(5,5,6,0) 72%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 330,
            height: 2,
            background:
              "linear-gradient(90deg, rgba(5,5,6,0) 0%, rgba(224,195,152,0.85) 50%, rgba(5,5,6,0) 100%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 40,
              height: 40,
              border: "1px solid rgba(224,195,152,0.6)",
              alignItems: "center",
              justifyContent: "center",
              color: "#e0c398",
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            VB
          </div>
          <div
            style={{
              color: "#f2efe9",
              fontSize: 34,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            VelaBuilt
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              color: "#f2efe9",
              fontSize: 92,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
              maxWidth: 900,
            }}
          >
            Systems for what&rsquo;s next.
          </div>
          <div
            style={{
              color: "#c9c5bd",
              fontSize: 30,
              lineHeight: 1.4,
              display: "flex",
              maxWidth: 820,
            }}
          >
            Premium websites, follow-up systems and intelligent digital
            infrastructure for modern businesses.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
            color: "#8b8880",
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <span>Websites</span>
          <span>·</span>
          <span>Automation</span>
          <span>·</span>
          <span>AI Systems</span>
        </div>
      </div>
    ),
    size,
  );
}
