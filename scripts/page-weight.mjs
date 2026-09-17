/**
 * How much there is to read on a page: visible words and characters.
 * Used to hold a "reduce the homepage by a quarter" instruction to a number.
 *
 * Usage: node scripts/page-weight.mjs [route ...]
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];

const browser = await chromium.launch({ channel: "chrome", headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  // Open every <details> so FAQ answers count as content that exists.
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const text = (document.querySelector("main") ?? document.body).innerText.replace(/\s+/g, " ").trim();
    return {
      words: text.split(" ").filter(Boolean).length,
      chars: text.length,
      sections: document.querySelectorAll("main section").length,
      listItems: document.querySelectorAll("main li").length,
      height: document.body.scrollHeight,
    };
  });
  console.log(`${route}  words=${m.words}  chars=${m.chars}  sections=${m.sections}  listItems=${m.listItems}  height=${m.height}px`);
}
await browser.close();
