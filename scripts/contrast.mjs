/**
 * WCAG AA contrast, measured from rendered pixels.
 *
 * Text sits over photographic plates composited by WebGL, so no CSS-walking
 * tool can judge it: axe marks ~250 nodes "needs review" and Lighthouse once
 * scored 100 while FAQ text measured 0.5:1. The only honest method is to make
 * the glyphs transparent, keep everything that protects them (text-shadow,
 * scrims, element opacity), photograph what is actually behind each line, and
 * take the worst realistic background luminance under it.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch({
  channel: "chrome",
  headless: false, // real GPU, so the compositor runs rather than the stills
  args: ["--hide-scrollbars"],
});
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const failures = [];
let measured = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000); // idle callback + shader build + first plate

  const height = await page.evaluate(() => document.body.scrollHeight);
  const stops = [];
  for (let y = 0; y < height - VIEWPORT.height; y += Math.floor(VIEWPORT.height * 0.9)) stops.push(y);
  if (!stops.length) stops.push(0);

  for (const y of stops.slice(0, 14)) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(1400); // let any committed cut finish

    // 1. Every visible run of text, with the colour it is actually painted in.
    const items = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        const el = node.parentElement;
        if (!el) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) continue;
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
        // Fold every ancestor's opacity in: text at 0.4 opacity is not the
        // colour its own style claims.
        let o = 1, p = el;
        while (p) { o *= parseFloat(getComputedStyle(p).opacity || "1"); p = p.parentElement; }
        if (o < 0.08) continue; // mid-fade or deliberately hidden
        out.push({
          text: node.nodeValue.trim().slice(0, 40),
          color: cs.color,
          size: parseFloat(cs.fontSize),
          weight: parseInt(cs.fontWeight, 10) || 400,
          opacity: o,
          rect: { x: Math.max(0, r.left), y: Math.max(0, r.top),
                  w: Math.min(r.width, innerWidth - Math.max(0, r.left)),
                  h: Math.min(r.height, innerHeight - Math.max(0, r.top)) },
        });
      }
      return out;
    });
    if (!items.length) continue;

    // 2. Hide the glyphs but keep everything that protects them.
    await page.addStyleTag({ content: `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; }` });
    await page.waitForTimeout(350);
    const shot = (await page.screenshot({ type: "png" })).toString("base64");

    // 3. Read what is behind each line.
    const results = await page.evaluate(async ({ shot, items }) => {
      const img = new Image();
      img.src = "data:image/png;base64," + shot;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      // The percentile is computed here rather than shipped out: a full-width
      // heading is ~1.3M subpixels, and moving those across the protocol for
      // every line on the page is what made this unusable.
      const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      return items.map((it) => {
        const { x, y, w, h } = it.rect;
        const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
        const d = ctx.getImageData(Math.round(x), Math.round(y), W, H).data;
        const lums = [];
        // Every 3rd pixel in each direction: 9x cheaper, and a background that
        // is bright enough to break contrast is never one stray pixel wide.
        for (let row = 0; row < H; row += 3) {
          for (let col = 0; col < W; col += 3) {
            const i = (row * W + col) * 4;
            lums.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
          }
        }
        lums.sort((p, q) => p - q);
        return { text: it.text, color: it.color, size: it.size, weight: it.weight,
                 opacity: it.opacity, bg: lums[Math.floor(lums.length * 0.95)] ?? 0 };
      });
    }, { shot, items });

    await page.evaluate(() => {
      const tags = document.querySelectorAll("style");
      tags[tags.length - 1]?.remove();
    });

    for (const r of results) {
      // The bright end of the background is the hard case for pale text.
      const bg = r.bg;
      const m = r.color.match(/[\d.]+/g).map(Number);
      const fgRaw = lum(m[0], m[1], m[2]);
      // Element opacity composites the text toward its background.
      const fg = fgRaw * r.opacity + bg * (1 - r.opacity);
      const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
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
console.log(`measured ${measured} text elements`);
if (failures.length) {
  console.log(`FAILURES (${failures.length}):`);
  for (const f of [...new Set(failures)].slice(0, 25)) console.log("  " + f);
} else {
  console.log("no contrast failures");
}
