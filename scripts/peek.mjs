/**
 * Diagnostic: screenshot the 3D world at chosen points in the journey, with
 * the readability scrim and the CSS backdrop optionally stripped away, so the
 * corridor can be judged on its own.
 *
 * Usage: node scripts/peek.mjs [--raw] [progress ...]
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const RAW = process.argv.includes("--raw");
const points = process.argv.slice(2).filter((a) => !a.startsWith("--")).map(Number);
const PROGRESS = points.length > 0 ? points : [0, 0.2, 0.4, 0.6, 0.8, 1];
const DIR = process.env.PEEK_DIR ?? "/tmp/velabuilt-peek";

await mkdir(DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});

const page = await browser.newPage({ viewport: { width: 1512, height: 945 } });
page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 160));
});

await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const hasCanvas = await page.evaluate(() => Boolean(document.querySelector("canvas")));
console.log("canvas mounted:", hasCanvas);

if (RAW) {
  // Strip the scrim and the CSS world so only the corridor remains.
  await page.evaluate(() => {
    const stage = document.querySelector("[data-tier]");
    if (!stage) return;
    for (const child of stage.children) {
      if (!child.querySelector("canvas") && !(child instanceof HTMLCanvasElement)) {
        child.setAttribute("style", "display:none");
      }
    }
    document.querySelector("main")?.setAttribute("style", "opacity:0.06");
    document.querySelector("header")?.setAttribute("style", "opacity:0.06");
  });
}

const journeyEl = await page.evaluate(() => {
  const el = document.getElementById("journey");
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top + window.scrollY, height: rect.height, vh: window.innerHeight };
});

for (const progress of PROGRESS) {
  const target = journeyEl.top + (journeyEl.height - journeyEl.vh) * progress;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), target);
  // Let the damped camera settle.
  await page.waitForTimeout(2200);
  const name = `${RAW ? "raw" : "full"}-${String(progress).replace(".", "_")}.png`;
  await page.screenshot({ path: `${DIR}/${name}` });
  console.log("captured", name);
}

await browser.close();
