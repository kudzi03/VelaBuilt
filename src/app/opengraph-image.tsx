import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { stillPaths } from "@/vela/VelaStill";

/**
 * The social card, generated at build time.
 *
 * The site's own ground and its own object: the same armature the page draws
 * at first paint, projected from the same geometry. No photography, no stock
 * imagery, and nothing claimed that the site does not also say.
 */

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function objectSvg() {
  const { near, far, viewBox } = stillPaths();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="560" height="560">
<defs>
<radialGradient id="c"><stop offset="0" stop-color="#140f0a" stop-opacity="0.5"/><stop offset="0.55" stop-color="#140f0a" stop-opacity="0.16"/><stop offset="1" stop-color="#140f0a" stop-opacity="0"/></radialGradient>
<radialGradient id="e"><stop offset="0" stop-color="#fff4dc" stop-opacity="0.95"/><stop offset="0.35" stop-color="#f29a38" stop-opacity="0.45"/><stop offset="1" stop-color="#f29a38" stop-opacity="0"/></radialGradient>
</defs>
<circle r="0.78" fill="url(#c)"/>
<path d="${far}" stroke="#161512" stroke-opacity="0.22" stroke-width="0.007" fill="none"/>
<path d="${near}" stroke="#161512" stroke-opacity="0.78" stroke-width="0.009" fill="none"/>
<circle r="0.24" fill="url(#e)"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f1ec",
          padding: "64px 72px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={objectSvg()}
          width={560}
          height={560}
          alt=""
          style={{ position: "absolute", right: 24, top: 35 }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 640,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", color: "#151412", fontSize: 30, letterSpacing: 0.5 }}>
            VelaBuilt
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                color: "#151412",
                fontSize: 70,
                lineHeight: 1.04,
                letterSpacing: -2,
                fontWeight: 600,
              }}
            >
              We build the systems a business runs on.
            </div>
            <div style={{ display: "flex", color: "#34322e", fontSize: 27, lineHeight: 1.4 }}>
              Websites, AI agents, automation and business systems.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              color: "#7a4f15",
              fontSize: 18,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            <span>Digital</span>
            <span>·</span>
            <span>AI</span>
            <span>·</span>
            <span>Automation</span>
            <span>·</span>
            <span>Systems</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
