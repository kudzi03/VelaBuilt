/**
 * Interaction QA: the two paths a visitor actually takes.
 *
 *   1. Keyboard — skip link, focus visibility, reaching the primary CTA.
 *   2. The enquiry — opening the dialog, answering, submitting, confirmation.
 *
 * Run against a production build with the server on :3000.
 */

import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const problems = [];
const fail = (message) => problems.push(message);

const browser = await chromium.launch({
  executablePath:
    process.env.QA_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1512, height: 945 } });
page.on("pageerror", (error) => fail(`page error: ${error.message}`));

/* -- 1. Keyboard ---------------------------------------------------------- */

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

await page.keyboard.press("Tab");
const first = await page.evaluate(() => {
  const el = document.activeElement;
  return { text: el?.textContent?.trim().slice(0, 30), href: el?.getAttribute("href") };
});
if (first.href !== "#main") fail(`first Tab should reach the skip link, got ${first.href}`);

// Walk the header and confirm every stop is visible and has an accessible name.
const walk = [];
for (let i = 0; i < 12; i += 1) {
  await page.keyboard.press("Tab");
  const stop = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28),
      onScreen: rect.width > 0 && rect.height > 0,
      // A focus ring must actually be drawn.
      outline: style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0,
    };
  });
  if (stop) walk.push(stop);
}
const unnamed = walk.filter((s) => !s.name);
if (unnamed.length) fail(`${unnamed.length} focus stop(s) with no accessible name`);
const invisible = walk.filter((s) => !s.onScreen);
if (invisible.length) fail(`${invisible.length} focus stop(s) not visible`);
const unringed = walk.filter((s) => !s.outline);
if (unringed.length) fail(`${unringed.length} focus stop(s) with no visible focus ring`);
console.log(`keyboard: ${walk.length} stops, all named/visible/ringed =`, unnamed.length + invisible.length + unringed.length === 0);

/* -- 2. The enquiry ------------------------------------------------------- */

await page.click('header a[href="/start"]');
await page.waitForTimeout(700);

const dialogOpen = await page.evaluate(() => {
  const dialog = document.querySelector("dialog");
  if (!dialog) return { open: false, focusInside: false, centred: false };
  const rect = dialog.getBoundingClientRect();
  return {
    open: dialog.open,
    focusInside: dialog.contains(document.activeElement),
    // A reset that zeroes the UA margin pins a modal dialog to the corner.
    // The tolerance absorbs the scrollbar gutter, which appears and disappears
    // as the dialog locks scrolling; the failure this guards against is off by
    // hundreds of pixels, not tens.
    centred:
      Math.abs(rect.left + rect.width / 2 - innerWidth / 2) < 24 &&
      Math.abs(rect.top + rect.height / 2 - innerHeight / 2) < 24,
  };
});
if (!dialogOpen.open) fail("Start a project did not open the dialog");
if (!dialogOpen.focusInside) fail("focus did not move into the dialog");
if (!dialogOpen.centred) fail("the dialog is not centred in the viewport");

// Escape must close a native dialog.
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
if (await page.evaluate(() => document.querySelector("dialog")?.open)) {
  fail("Escape did not close the dialog");
}

// Reopen and complete the flow.
await page.click('header a[href="/start"]');
await page.waitForTimeout(600);

await page.click('label[for="enq-focus-follow-up"]');
await page.waitForTimeout(600);
await page.click('label[for="enq-follow-up-problem-chasing"]');
await page.click('label[for="enq-follow-up-problem-speed"]');
await page.click('dialog button:has-text("Continue")');
await page.waitForTimeout(500);
await page.click('label[for="enq-timeline-now"]');
await page.waitForTimeout(700);

const atDetails = await page.evaluate(() => Boolean(document.querySelector("#enq-email")));
if (!atDetails) fail("the flow did not reach the contact step");

// Submitting with nothing filled must not send, and must say why.
await page.click('dialog button[type="submit"]');
await page.waitForTimeout(400);
const validation = await page.evaluate(() => ({
  invalid: document.querySelectorAll('[aria-invalid="true"]').length,
  errors: document.querySelectorAll('dialog p[id$="-error"], dialog [role="alert"]').length,
  focused: document.activeElement?.id,
}));
if (validation.errors === 0) fail("empty submit produced no visible error");
if (validation.focused !== "enq-name") fail(`focus not moved to the first error (got ${validation.focused})`);

await page.fill("#enq-name", "Test Person");
await page.fill("#enq-email", "test@example.com");
await page.check("#enq-consent");
await page.click('dialog button[type="submit"]');
await page.waitForTimeout(2500);

const confirmation = await page.evaluate(() => {
  const text = document.querySelector("dialog")?.textContent ?? "";
  return {
    thanked: /thank you/i.test(text),
    reference: /VB-\d{4}-/.test(text),
    stages: /Enquiry/.test(text) && /Review/.test(text) && /Follow-up/.test(text),
    usingASystem: /VelaBuilt system right now/i.test(text),
  };
});
if (!confirmation.thanked) fail("no confirmation shown after submitting");
if (!confirmation.reference) fail("no reference shown");
if (!confirmation.stages) fail("the enquiry→review→follow-up stages were not shown");
console.log("enquiry:", JSON.stringify(confirmation));

await page.screenshot({ path: "/tmp/velabuilt-qa/enquiry-confirmation.png" });
await browser.close();

console.log(`\n${problems.length} problem(s)\n`);
for (const problem of problems) console.log(`  ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
