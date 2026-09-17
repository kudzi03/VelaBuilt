/**
 * WCAG AA contrast, measured from rendered pixels.
 *
 * Text sits over photographic plates composited by WebGL, so no CSS-walking
 * tool can judge it: axe marks ~250 nodes "needs review" and Lighthouse once
 * scored 100 while FAQ text measured 0.5:1.
 *
 * The method:
 *   1. Take each run of text by its own line boxes (Range.getClientRects),
 *      not its element box. A heading must be judged on what is behind its
 *      letters, not on the bright window right of its last word.
 *   2. Photograph the page once with every glyph made transparent, keeping
 *      everything that protects text: scrims, title pools, panels, shadows.
 *   3. Sample inside those line boxes, and take contrast at both ends of the
 *      background distribution, reporting the worse — pale text fails over a
 *      highlight, dark text fails over a shadow.
 *
 * Two exposures are deliberately NOT diffed to locate the glyphs. A WebGL
 * canvas created without preserveDrawingBuffer captures black at
 * unpredictable moments, so the difference between two shots is sometimes the
 * whole viewport, and then every element reads as a flat 1:1.
 *
 * Usage: node scripts/contrast.mjs [route ...]      (BASE=http://localhost:3100)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const VIEWPORT = { width: 1440, height: 900 };

/** Foil type sets color:transparent and paints its glyphs with this gradient. */
const FOIL_INK = [224, 195, 152];

const browser = await chromium.launch({
  channel: "chrome",
  headless: false, // real GPU, so the compositor runs rather than the stills
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

const failures = [];
let measured = 0;
let skipped = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000); // idle callback + shader build + first plate

  const height = await page.evaluate(() => document.body.scrollHeight);
  const stops = [];
  for (let y = 0; y < height - VIEWPORT.height; y += Math.floor(VIEWPORT.height * 0.9)) stops.push(y);
  if (!stops.length) stops.push(0);

  for (const y of stops.slice(0, 16)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(1400); // let any committed cut finish

    const items = await page.evaluate((FOIL) => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        const el = node.parentElement;
        if (!el) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        // Visually hidden text is exposed to assistive technology on purpose
        // and is never painted for a sighted reader, so it has no contrast to
        // measure. getClientRects still reports its unclipped size.
        if (el.closest(".sr-only")) continue;
        // WCAG 1.4.3 exempts inactive controls: a disabled button is dimmed
        // precisely to say it cannot be used.
        if (el.closest("[disabled], [aria-disabled=true]")) continue;

        // Fold every ancestor opacity in: text at 0.4 opacity is not the
        // colour its own style claims.
        let o = 1, p = el;
        while (p) { o *= parseFloat(getComputedStyle(p).opacity || "1"); p = p.parentElement; }
        if (o < 0.08) continue; // mid-fade or deliberately hidden

        // Foil paints its glyphs with a clipped gradient, so its computed
        // colour is transparent and tells us nothing.
        const foil = el.closest(".foil") !== null || cs.color === "rgba(0, 0, 0, 0)";
        const m = foil ? FOIL : (cs.color.match(/[\d.]+/g) || []).map(Number);
        if (m.length < 3) continue;

        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()]
          .filter((r) => r.width >= 4 && r.height >= 4)
          .filter((r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)
          .map((r) => ({
            x: Math.max(0, Math.round(r.left)),
            y: Math.max(0, Math.round(r.top)),
            w: Math.round(Math.min(r.width, innerWidth - Math.max(0, r.left))),
            h: Math.round(Math.min(r.height, innerHeight - Math.max(0, r.top))),
          }))
          .filter((r) => r.w > 0 && r.h > 0);
        if (!rects.length) continue;

        out.push({
          text: node.nodeValue.trim().slice(0, 40),
          ink: [m[0], m[1], m[2]],
          opacity: o,
          size: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight, 10) || 400,
          rects,
        });
      }
      return out;
    }, FOIL_INK);
    if (!items.length) continue;

    await page.addStyleTag({ content: `
      *, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; }
      /* Unclip foil, or its letters stay on screen and the measurement
         compares the type against itself. */
      .foil { background-image: none !important; -webkit-background-clip: border-box !important; background-clip: border-box !important; }
    ` });
    await page.waitForTimeout(350);
    const shot = (await page.screenshot({ type: "png" })).toString("base64");

    const results = await page.evaluate(async ({ shot, items }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + shot;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const li = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = (r, g, b) => 0.2126 * li(r) + 0.7152 * li(g) + 0.0722 * li(b);

      return items.map((it) => {
        const lums = [];
        for (const r of it.rects) {
          const d = ctx.getImageData(r.x, r.y, r.w, r.h).data;
          for (let i = 0; i < d.length; i += 4) lums.push(L(d[i], d[i + 1], d[i + 2]));
        }
        lums.sort((p, q) => p - q);
        return {
          text: it.text, ink: it.ink, opacity: it.opacity, size: it.size, weight: it.weight,
          samples: lums.length,
          lo: lums[Math.floor(lums.length * 0.05)] ?? null,
          hi: lums[Math.floor(lums.length * 0.95)] ?? null,
        };
      });
    }, { shot, items });

    await page.evaluate(() => {
      const tags = document.querySelectorAll("style");
      tags[tags.length - 1]?.remove();
    });

    for (const r of results) {
      if (r.samples < 24 || r.lo === null) { skipped += 1; continue; }
      const inkL = lum(r.ink[0], r.ink[1], r.ink[2]);
      const ratioAt = (bg) => {
        const fg = inkL * r.opacity + bg * (1 - r.opacity);
        return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
      };
      const ratio = Math.min(ratioAt(r.hi), ratioAt(r.lo));
      const large = r.size >= 24 || (r.size >= 18.66 && r.weight >= 700);
      const need = large ? 3 : 4.5;
      measured += 1;
      if (ratio < need) {
        failures.push(`${route} @${y} "${r.text}" ${ratio.toFixed(2)}:1 (needs ${need}, ${Math.round(r.size)}px)`);
      }
    }
  }
}

await browser.close();
console.log(`measured ${measured} runs of text (${skipped} skipped)`);
if (failures.length) {
  console.log(`FAILURES (${failures.length}):`);
  for (const f of [...new Set(failures)].slice(0, 30)) console.log("  " + f);
} else {
  console.log("no contrast failures");
}
