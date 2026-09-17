/**
 * Diagnostic screenshots at chosen scroll positions, with the real GPU so the
 * compositor runs rather than the stills fallback.
 *
 * Usage: node scripts/shots.mjs <outDir> [scrollY ...]
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const out = process.argv[2] ?? "shots";
const stops = process.argv.slice(3).map(Number);
const POINTS = stops.length ? stops : [0, 1800, 2960, 4579, 6500, 9800];
const BASE = process.env.BASE ?? "http://localhost:3100";

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--hide-scrollbars"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForTimeout(4500);

for (const y of POINTS) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/y${y}.png` });
  console.log(`${out}/y${y}.png`);
}
await browser.close();
