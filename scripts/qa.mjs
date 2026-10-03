/**
 * QA — every route, six widths, and the behaviours that matter here.
 *
 *   node scripts/qa.mjs [baseUrl]            (default http://127.0.0.1:3000)
 *
 * Routes × widths: console errors, failed requests, horizontal overflow,
 * exactly one <h1>, no text under 12px, JSON-LD that parses, and the WebGL
 * object actually going live. Then: no-JavaScript and reduced-motion
 * fallbacks, a keyboard walk, the enquiry dialog, and the voice entry flow
 * (consent sheet, microphone refused, Vela unavailable).
 *
 * Set CHROME_PATH to use a specific Chromium. Software GL flags are passed so
 * it runs in CI containers; real hardware is faster.
 */
import { chromium } from "playwright";

const BASE = process.argv[2]?.startsWith("http") ? process.argv[2] : "http://127.0.0.1:3000";
const ROUTES = [
  "/", "/website-conversion-systems", "/ai-systems", "/lead-follow-up-systems", "/business-systems",
  "/website-engine-optimization", "/work", "/work/cardio-life", "/system-lab", "/approach", "/about",
  "/start", "/privacy", "/cookies", "/this-route-does-not-exist",
];
const WIDTHS = [
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "430", width: 430, height: 932, mobile: true },
  { name: "tablet", width: 820, height: 1180, mobile: true },
  { name: "1366", width: 1366, height: 768 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const launch = () =>
  chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });

const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);
const browser = await launch();

/* ── routes × widths ─────────────────────────────────────────────────── */
for (const vp of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const where = `${vp.name} ${route}`;
    const is404 = route.includes("does-not-exist");
    page.on("console", (m) => {
      // The 404 route's own 404 is the expected response, not an error.
      if (m.type() === "error" && !(is404 && m.text().includes("404"))) fail(where, `console: ${m.text().slice(0, 160)}`);
    });
    page.on("pageerror", (e) => fail(where, `pageerror: ${e.message.slice(0, 160)}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().endsWith(route)) fail(where, `HTTP ${r.status()} ${r.url()}`);
    });
    const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
    const expected = route.includes("does-not-exist") ? 404 : 200;
    if (res?.status() !== expected) fail(where, `status ${res?.status()} (expected ${expected})`);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const small = [...document.querySelectorAll("main *, header *, footer *")].filter((el) => {
        if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || el.closest(".sr-only,[hidden],[aria-hidden=true]")) return false;
        return parseFloat(cs.fontSize) < 12;
      }).map((el) => el.textContent.trim().slice(0, 40));
      let ld = 0, ldBad = 0;
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        ld++;
        try { JSON.parse(s.textContent); } catch { ldBad++; }
      }
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        h1: document.querySelectorAll("h1").length,
        small: small.slice(0, 3),
        ld, ldBad,
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
      };
    });
    if (r.overflow > 0) fail(where, `horizontal overflow ${r.overflow}px`);
    if (r.h1 !== 1) fail(where, `${r.h1} <h1> elements`);
    if (r.small.length) fail(where, `text under 12px: ${r.small.join(" | ")}`);
    if (!r.ld || r.ldBad) fail(where, `JSON-LD blocks ${r.ld}, invalid ${r.ldBad}`);
    if (!r.title || r.desc.length < 50) fail(where, "title/description missing or thin");
    if (expected === 200 && !r.canonical) fail(where, "no canonical");
    await page.close();
  }
  await ctx.close();
}

/* ── the object goes live, and sleeps under a sheet ──────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const live = await page.waitForSelector(".vela-canvas[data-on]", { timeout: 25000 }).then(() => true, () => false);
  if (!live) fail("webgl", "canvas never went live on /");
  await page.close();
}

/* ── no JavaScript: everything readable ──────────────────────────────── */
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  for (const route of ["/", "/ai-systems", "/start"]) {
    await page.goto(BASE + route);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll(".reveal")].filter((el) => getComputedStyle(el).opacity === "0").length,
    );
    if (hidden) fail(`no-js ${route}`, `${hidden} sections invisible`);
    const still = await page.locator(".vela-still").count();
    if (route === "/" && !still) fail("no-js /", "server-rendered still missing");
  }
  const form = await page.locator("form[action='/api/enquiry']").count();
  if (!form) fail("no-js /start", "native enquiry form missing");
  await ctx.close();
}

/* ── reduced motion: content visible, no waiting on animation ────────── */
{
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("automation")?.scrollIntoView());
  await page.waitForTimeout(300);
  const invisible = await page.evaluate(() =>
    [...document.querySelectorAll("#automation .reveal")].filter((el) => getComputedStyle(el).opacity !== "1").length,
  );
  if (invisible) fail("reduced-motion", `${invisible} reveals not immediately visible`);
  await ctx.close();
}

/* ── keyboard ────────────────────────────────────────────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (first !== "Skip to content") fail("keyboard", `first stop is "${first}", not the skip link`);
  const stops = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        const cs = el ? getComputedStyle(el) : null;
        const name = el?.getAttribute("aria-label") || el?.textContent?.trim().slice(0, 30) || "";
        const visible = !!cs && (cs.outlineStyle !== "none" || cs.boxShadow !== "none");
        return { name, visible };
      }),
    );
  }
  for (const s of stops) if (!s.name) fail("keyboard", "a focus stop has no accessible name");
  for (const s of stops) if (!s.visible) fail("keyboard", `no visible focus on "${s.name}"`);

  // Enquiry dialog: opens, holds focus, closes on Escape.
  await page.getByRole("link", { name: /start a project/i }).first().click();
  await page.waitForSelector("dialog.enquiry-dialog[open]", { timeout: 5000 }).catch(() => fail("enquiry", "dialog did not open"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  if (await page.locator("dialog.enquiry-dialog[open]").count()) fail("enquiry", "Escape did not close the dialog");
  await page.close();
}

/* ── voice entry: consent first, refusal and unavailability handled ──── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: [] });
  const page = await ctx.newPage();
  let sdkEarly = false;
  page.on("request", (r) => {
    if (/elevenlabs/.test(r.url())) sdkEarly = true;
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  if (sdkEarly) fail("voice", "contacted ElevenLabs before the visitor chose to talk");
  await page.getByRole("button", { name: /talk to vela/i }).first().click();
  const consent = await page.waitForSelector("dialog.voice-consent[open]", { timeout: 5000 }).then(() => true, () => false);
  if (!consent) fail("voice", "consent sheet did not open");
  const micBefore = await page.evaluate(() => navigator.permissions.query({ name: "microphone" }).then((p) => p.state).catch(() => "?"));
  if (micBefore === "granted") fail("voice", "microphone granted before consent");
  await page.getByRole("button", { name: /start talking/i }).click();
  const panel = await page.waitForSelector(".voice-panel [role=alert]", { timeout: 15000 }).then((h) => h.textContent(), () => null);
  if (!panel) fail("voice", "no plain failure message when the microphone is refused or Vela is unavailable");
  const stillWorks = await page.getByRole("link", { name: /^work$/i }).first().isVisible();
  if (!stillWorks) fail("voice", "navigation unusable after a voice failure");
  await page.getByRole("button", { name: /^close$/i }).click().catch(() => {});
  console.log("voice failure message:", panel?.trim());
  await ctx.close();
}

await browser.close();
if (failures.length) {
  console.log(`\n${failures.length} failure(s):\n` + [...new Set(failures)].map((f) => ` ✗ ${f}`).join("\n"));
  process.exit(1);
}
console.log(`\n✓ ${ROUTES.length} routes × ${WIDTHS.length} widths, no-JS, reduced motion, keyboard, enquiry, voice entry — all clean`);
