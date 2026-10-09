/** Focused regression for the user-initiated restaurant walkthrough. */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:3000";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const errors = [];
    const media = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (request.url().endsWith("walkthrough.mp4")) media.push(request.url()); });
    await page.goto(`${base}/demo/ember-and-grain`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Step inside the restaurant" }).waitFor();
    assert.equal(media.length, 0, "Video must not load before entry");
    assert.equal(await page.locator("h1").count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
    await page.getByRole("button", { name: "Step inside the restaurant" }).click();
    await page.waitForFunction(() => document.querySelector("video")?.currentTime > .3, { timeout: 30000 });
    assert.ok(media.length > 0, "Entry must request real video");
    assert.ok(await page.locator("video").evaluate(el => el.muted && el.videoWidth > 0 && el.duration > 3));
    await page.getByRole("button", { name: "Pause walkthrough", exact: true }).click();
    assert.ok(await page.locator("video").evaluate(el => el.paused));
    await page.getByRole("button", { name: "Continue walkthrough", exact: true }).click();
    await page.locator("#menu").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector("video").paused);
    await page.getByRole("button", { name: "Continue walkthrough", exact: true }).click();
    await page.getByRole("button", { name: "Find a table", exact: true }).click();
    assert.ok(await page.locator("video").evaluate(el => el.paused), "Booking must pause footage");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Continue walkthrough", exact: true }).click();
    await page.locator("video").evaluate(el => { el.currentTime = el.duration - .15; });
    await page.getByRole("button", { name: "Replay walkthrough", exact: true }).waitFor();
    await page.getByRole("button", { name: "Replay walkthrough", exact: true }).click();
    await page.waitForFunction(() => { const el = document.querySelector("video"); return !el.paused && el.currentTime < 2; });
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`${width}px: on-demand media, playback, pause, offscreen pause, booking pause, replay and overflow passed`);
  }
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto(`${base}/demo/ember-and-grain`, { waitUntil: "domcontentloaded" });
  assert.equal(await reduced.locator("video").getAttribute("src"), null);
  assert.equal(await reduced.locator("h1 > span").first().evaluate(el => getComputedStyle(el).animationName), "none");
  await reduced.close();

  const failure = await browser.newPage();
  await failure.route("**/walkthrough.mp4", route => route.abort());
  await failure.goto(`${base}/demo/ember-and-grain`, { waitUntil: "domcontentloaded" });
  await failure.getByRole("button", { name: "Step inside the restaurant" }).click();
  await failure.getByRole("status").filter({ hasText: "couldn’t load" }).waitFor();
  assert.ok(await failure.getByRole("link", { name: "The menu", exact: true }).isVisible());
  console.log("Reduced-motion still and media-error fallback passed");
  await failure.close();
} finally { await browser.close(); }
