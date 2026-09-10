/**
 * Verifies the progressive-enhancement tiers behave as designed.
 *
 *   reduced-motion  → Tier C, no canvas, content fully visible
 *   no WebGL        → Tier C, no canvas, content fully visible
 *   no JavaScript   → semantic content, headings, links and copy all present
 *
 * The point of each check is the same: the visitor must be able to read what
 * VelaBuilt does and act on it, with the cinematic layer switched off.
 */

import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const problems = [];

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});

/** The content that must survive in every tier. */
const audit = () => {
  const text = document.body.innerText;
  const stage = document.querySelector("[data-tier]");
  return {
    tier: stage?.getAttribute("data-tier") ?? null,
    canvas: Boolean(document.querySelector("canvas")),
    h1: document.querySelector("h1")?.textContent?.trim() ?? null,
    headings: document.querySelectorAll("h1, h2, h3").length,
    links: document.querySelectorAll("a[href]").length,
    hasProposition: text.includes("Premium websites"),
    hasAllThreeOffers:
      text.includes("Website Conversion System") &&
      text.includes("Lead Follow-Up") &&
      text.includes("Website Engine Optimization"),
    hasCta: [...document.querySelectorAll("a")].some((a) =>
      /start a project/i.test(a.textContent ?? ""),
    ),
    // Only sections actually on screen: a reveal far below the fold is
    // supposed to still be waiting its turn, and counting those would make
    // correct behaviour look like a fault.
    hiddenReveals: [...document.querySelectorAll(".reveal")].filter((el) => {
      const rect = el.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      return onScreen && Number(getComputedStyle(el).opacity) < 0.9;
    }).length,
  };
};

async function check(label, contextOptions, init) {
  const context = await browser.newContext(contextOptions);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const result = await page.evaluate(audit);
  console.log(label.padEnd(16), JSON.stringify(result));

  if (!result.h1) problems.push(`${label}: no <h1>`);
  if (!result.hasProposition) problems.push(`${label}: proposition missing`);
  if (!result.hasAllThreeOffers) problems.push(`${label}: an offer is missing`);
  if (!result.hasCta) problems.push(`${label}: no Start a project link`);
  if (result.headings < 8) problems.push(`${label}: only ${result.headings} headings`);
  if (result.hiddenReveals > 0) {
    problems.push(`${label}: ${result.hiddenReveals} sections stuck hidden`);
  }

  await page.screenshot({ path: `/tmp/velabuilt-qa/fallback-${label}.png` });
  await context.close();
  return result;
}

const reduced = await check("reduced-motion", {
  viewport: { width: 1512, height: 945 },
  reducedMotion: "reduce",
});
if (reduced.canvas) problems.push("reduced-motion: a canvas was mounted");
if (reduced.tier !== "C") problems.push(`reduced-motion: tier ${reduced.tier}`);

// Make every WebGL context request fail, exactly as a blocked or broken
// driver would, and confirm the site degrades rather than blanking.
const noWebgl = await check(
  "no-webgl",
  { viewport: { width: 1512, height: 945 } },
  () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (typeof type === "string" && type.toLowerCase().includes("webgl")) return null;
      return original.call(this, type, ...rest);
    };
  },
);
if (noWebgl.canvas) problems.push("no-webgl: a canvas was mounted");
if (noWebgl.tier !== "C") problems.push(`no-webgl: tier ${noWebgl.tier}`);

const noJs = await check("no-javascript", {
  viewport: { width: 1512, height: 945 },
  javaScriptEnabled: false,
});
if (noJs.canvas) problems.push("no-javascript: a canvas was mounted");

await browser.close();

console.log(`\n${problems.length} problem(s)\n`);
for (const problem of problems) console.log(`  ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
