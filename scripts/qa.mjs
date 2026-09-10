/**
 * Visual and behavioural QA pass.
 *
 * Drives a real browser over every route at desktop and phone widths and
 * reports the failures that matter for this site specifically:
 *
 *   · console errors and failed requests
 *   · horizontal overflow (the one thing that ruins a dark full-bleed layout)
 *   · headings missing, or more than one <h1>
 *   · text smaller than 12px
 *   · elements overflowing the viewport
 *   · WebGL actually initialising, and the tier that was chosen
 *
 * Usage:  node scripts/qa.mjs [baseUrl] [--shots]
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2]?.startsWith("http")
  ? process.argv[2]
  : "http://127.0.0.1:3000";
const TAKE_SHOTS = process.argv.includes("--shots");
const SHOT_DIR = process.env.QA_SHOT_DIR ?? "/tmp/velabuilt-qa";

const ROUTES = [
  "/",
  "/website-conversion-systems",
  "/lead-follow-up-systems",
  "/website-engine-optimization",
  "/system-lab",
  "/work",
  "/approach",
  "/about",
  "/start",
  "/privacy",
  "/this-route-does-not-exist",
];

const VIEWPORTS = [
  { name: "desktop", width: 1512, height: 945, isMobile: false },
  { name: "phone", width: 390, height: 844, isMobile: true },
];

const problems = [];
const note = (route, viewport, message) =>
  problems.push(`[${viewport}] ${route} — ${message}`);

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});

if (TAKE_SHOTS) await mkdir(SHOT_DIR, { recursive: true });

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.isMobile ? 2 : 1,
    hasTouch: viewport.isMobile,
    isMobile: viewport.isMobile,
    userAgent: viewport.isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });

  for (const route of ROUTES) {
    const page = await context.newPage();
    const errors = [];

    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text().slice(0, 200));
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "";
      if (!failure.includes("ERR_ABORTED")) {
        errors.push(`request failed: ${request.url().slice(0, 90)} ${failure}`);
      }
    });

    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });

    const expected404 = route.includes("does-not-exist");
    const status = response?.status() ?? 0;
    if (expected404 && status !== 404) note(route, viewport.name, `expected 404, got ${status}`);
    if (!expected404 && status !== 200) note(route, viewport.name, `status ${status}`);

    // Let the canvas mount and the reveals settle.
    await page.waitForTimeout(2600);

    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const results = {
        overflow: doc.scrollWidth - doc.clientWidth,
        h1Count: document.querySelectorAll("h1").length,
        title: document.title,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
        tier: document.querySelector("[data-tier]")?.getAttribute("data-tier") ?? null,
        canvas: Boolean(document.querySelector("canvas")),
        tiny: [],
        wide: [],
        contrast: [],
      };

      // Relative luminance and contrast ratio, per WCAG 2.
      const luminance = (rgb) => {
        const channel = (value) => {
          const v = value / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return (
          0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
        );
      };

      const parseColor = (value) => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(",").map((n) => Number.parseFloat(n));
        // Text mid-fade is invisible, not low-contrast — skip it.
        if (parts.length > 3 && parts[3] < 0.95) return null;
        return parts.slice(0, 3);
      };

      const contrast = (foreground, background) => {
        const a = parseColor(foreground);
        const b = parseColor(background);
        if (!a || !b) return 0;
        const la = luminance(a);
        const lb = luminance(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };

      /** First opaque background colour up the ancestor chain. */
      const effectiveBackground = (element) => {
        let node = element;
        while (node && node !== document.documentElement) {
          const background = getComputedStyle(node).backgroundColor;
          const parsed = parseColor(background);
          if (parsed) return background;
          node = node.parentElement;
        }
        // The page ground: <html> carries it, since <body> is transparent.
        return "rgb(5, 5, 6)";
      };

      const viewportWidth = doc.clientWidth;
      for (const element of document.body.querySelectorAll("*")) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        if (rect.right > viewportWidth + 2 && rect.width < viewportWidth * 3) {
          const style = getComputedStyle(element);
          // Decorative layers are deliberately larger than the frame and are
          // clipped by an overflow-hidden parent; only real content counts.
          const decorative = element.closest("[aria-hidden='true']") !== null;
          // Anything inside a horizontal scroller is meant to run past the
          // frame; only overflow the visitor cannot reach is a fault.
          let scroller = element.parentElement;
          let scrollable = false;
          while (scroller && scroller !== document.body) {
            const parentStyle = getComputedStyle(scroller);
            if (parentStyle.overflowX === "auto" || parentStyle.overflowX === "scroll") {
              scrollable = true;
              break;
            }
            scroller = scroller.parentElement;
          }
          if (!decorative && !scrollable && style.position !== "fixed" && style.overflowX !== "auto") {
            results.wide.push(
              `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 40)} right=${Math.round(rect.right)}`,
            );
          }
        }

        const text = element.textContent?.trim() ?? "";
        if (text.length > 0 && element.children.length === 0) {
          const style = getComputedStyle(element);
          const size = Number.parseFloat(style.fontSize);
          if (size > 0 && size < 12) {
            results.tiny.push(`${Math.round(size * 10) / 10}px "${text.slice(0, 30)}"`);
          }

          // WCAG AA contrast against the background actually behind the text.
          // Most of the site sits on near-black, but a primary button is dark
          // ink on ivory — assuming one ground would report every CTA as
          // failing and make the whole check worthless.
          const ratio = contrast(style.color, effectiveBackground(element));
          const weight = Number.parseInt(style.fontWeight, 10) || 400;
          const large = size >= 24 || (size >= 18.66 && weight >= 700);
          const required = large ? 3 : 4.5;
          if (ratio > 0 && ratio < required) {
            results.contrast.push(
              `${ratio.toFixed(2)}:1 (needs ${required}) ${style.color} "${text.slice(0, 26)}"`,
            );
          }
        }
      }

      results.wide = [...new Set(results.wide)].slice(0, 5);
      results.tiny = [...new Set(results.tiny)].slice(0, 5);
      results.contrast = [...new Set(results.contrast)].slice(0, 6);
      return results;
    });

    if (audit.overflow > 1) {
      note(route, viewport.name, `horizontal overflow ${audit.overflow}px`);
    }
    for (const wide of audit.wide) note(route, viewport.name, `overflows viewport: ${wide}`);
    for (const tiny of audit.tiny) note(route, viewport.name, `tiny text ${tiny}`);
    for (const low of audit.contrast) note(route, viewport.name, `low contrast ${low}`);
    if (audit.h1Count !== 1) note(route, viewport.name, `${audit.h1Count} <h1> elements`);
    if (!audit.title) note(route, viewport.name, "missing <title>");
    if (!audit.description) note(route, viewport.name, "missing meta description");
    if (!expected404 && !audit.canonical) note(route, viewport.name, "missing canonical");
    for (const error of errors) {
      // The 404 route is *meant* to 404; its own document response is not a fault.
      if (expected404 && error.includes("404")) continue;
      note(route, viewport.name, `console: ${error}`);
    }

    if (route === "/") {
      console.log(
        `  ${viewport.name}: tier=${audit.tier} canvas=${audit.canvas} jsonLd=${audit.jsonLd}`,
      );
    }

    if (TAKE_SHOTS) {
      const slug = route === "/" ? "home" : route.replaceAll("/", "-").slice(1);
      await page.screenshot({
        path: `${SHOT_DIR}/${viewport.name}-${slug}.png`,
        fullPage: false,
      });
    }

    await page.close();
  }

  await context.close();
}

await browser.close();

console.log(`\n${problems.length} problem(s) found\n`);
for (const problem of problems) console.log(`  ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
