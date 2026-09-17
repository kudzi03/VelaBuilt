/**
 * Capture a live site for a case study: one desktop frame and one phone
 * frame, plus a tall desktop scroll for the page body.
 *
 * Usage: node scripts/capture-site.mjs <url> <outDir>
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2];
const out = process.argv[3];
if (!url || !out) { console.error("usage: capture-site.mjs <url> <outDir>"); process.exit(1); }

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--hide-scrollbars"] });

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await desktop.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await desktop.waitForTimeout(3500);
await desktop.screenshot({ path: `${out}/desktop.png` });
console.log(`${out}/desktop.png`);

await desktop.evaluate(() => window.scrollTo({ top: Math.round(document.body.scrollHeight * 0.28), behavior: "instant" }));
await desktop.waitForTimeout(1500);
await desktop.screenshot({ path: `${out}/desktop-2.png` });
console.log(`${out}/desktop-2.png`);

const phone = await browser.newPage({ ...devices["iPhone 13"] });
await phone.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await phone.waitForTimeout(3500);
await phone.screenshot({ path: `${out}/mobile.png` });
console.log(`${out}/mobile.png`);

await browser.close();
