/**
 * VOICE TOOLS, END TO END — without a live connection.
 *
 *   node scripts/voice-tools.mjs [baseUrl]    (default http://127.0.0.1:3000)
 *
 * Intercepts the ElevenLabs conversation WebSocket and plays the real
 * protocol to the real SDK in the page, then fires client tool calls the way
 * the agent would and checks what the site does with each: the page moves,
 * the structure changes chapter, bad values are refused without moving,
 * prefill waits for the visitor and never submits, End restores dormant.
 *
 * Needs a production server whose ELEVENLABS_AGENT_ID is set and whose
 * ELEVENLABS_API_KEY is not (so text mode uses the public WebSocket path).
 * What the agent decides to call is tested separately, on ElevenLabs.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const log = (...a) => console.log(...a);
let fails = 0;
const check = (name, ok, detail = "") => { if (!ok) fails++; log(ok ? "PASS" : "FAIL", name, detail); };

const results = new Map();
const clientMsgs = [];
let server;
await page.routeWebSocket(/api\.elevenlabs\.io\/v1\/convai\/conversation/, (ws) => {
  server = ws;
  ws.onMessage((raw) => {
    const m = JSON.parse(String(raw));
    clientMsgs.push(m);
    if (m.type === "conversation_initiation_client_data") {
      ws.send(JSON.stringify({
        type: "conversation_initiation_metadata",
        conversation_initiation_metadata_event: {
          conversation_id: "conv_mock",
          agent_output_audio_format: "pcm_16000",
          user_input_audio_format: "pcm_16000",
        },
      }));
      ws.send(JSON.stringify({ type: "agent_response", agent_response_event: { agent_response: "Hi, I'm Vela." } }));
    }
    if (m.type === "client_tool_result") results.set(m.tool_call_id, m);
  });
});

let n = 0;
async function tool(name, parameters, waitMs = 2500) {
  const id = `call_${++n}`;
  server.send(JSON.stringify({ type: "client_tool_call", client_tool_call: { tool_name: name, tool_call_id: id, parameters } }));
  const t0 = Date.now();
  while (!results.has(id) && Date.now() - t0 < waitMs) await page.waitForTimeout(100);
  await page.waitForTimeout(1400);
  return results.get(id);
}
const centre = () => page.evaluate(() => {
  const y = innerHeight / 2;
  return [...document.querySelectorAll("[data-chapter]")].find((e) => { const r = e.getBoundingClientRect(); return r.top <= y && r.bottom > y; })?.dataset.chapter;
});

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /talk to vela/i }).first().click();
check("consent sheet shown before anything connects", await page.locator("dialog.voice-consent[open]").count() === 1 && !server);
await page.getByRole("button", { name: /type instead/i }).click();
await page.waitForFunction(() => { const t = document.querySelector("#vela-text"); return t && !t.disabled; }, null, { timeout: 20000 });
check("session connects through the SDK", !!server);
const init = clientMsgs.find((m) => m.type === "conversation_initiation_client_data");
check("dynamic variables sent", init?.dynamic_variables?.current_path === "/", JSON.stringify(init?.dynamic_variables));

let r = await tool("focus_service", { service: "automation" });
check("focus_service automation → result", r && !r.is_error, r?.result);
check("  scrolled to automation chapter", (await centre()) === "automation", await centre());
check("  presence acting/speaking", ["acting", "listening", "speaking"].includes(await page.locator(".site-header").getAttribute("data-presence")), await page.locator(".site-header").getAttribute("data-presence"));

r = await tool("show_capability", { capability: "follow-up" });
log("  (show_capability result)", r?.result);
const lit = await page.locator("[data-cap-id][data-lit]").count();
check("  follow-up card lit", lit >= 1, String(lit));

r = await tool("focus_service", { service: "hacking" });
check("invalid service refused", r && /not one of/.test(r.result), r?.result);
check("  page did not move", (await centre()) === "automation");

r = await tool("navigate_site", { destination: "https://evil.example" });
check("URL destination refused", r && /no page called/.test(r.result), r?.result);

r = await tool("scroll_to_section", { section: "work" });
check("scroll_to_section work", (await centre()) === "work", await centre());

r = await tool("show_project", { project: "cardio_life" }, 4000);
await page.waitForURL("**/work/cardio-life", { timeout: 8000 }).catch(() => {});
check("show_project → case study", page.url().endsWith("/work/cardio-life"), page.url());
check("  session survived navigation", await page.locator(".voice-panel").count() === 1);

r = await tool("show_project", { project: "acme_corp" });
check("unpublished project refused", r && /no published project/.test(r.result), r?.result);

// Prefill: the result must wait on the visitor, and nothing is submitted.
const pid = `call_${++n}`;
server.send(JSON.stringify({ type: "client_tool_call", client_tool_call: { tool_name: "prefill_enquiry", tool_call_id: pid, parameters: { service: "automation", summary: "Contractor, wants missed calls followed up." } } }));
await page.waitForTimeout(1200);
check("prefill waits for consent (no result yet)", !results.has(pid));
check("  confirmation card shown", await page.getByRole("group", { name: /drafted an enquiry/i }).count() === 1);
await page.getByRole("button", { name: /yes, open the form/i }).click();
await page.waitForTimeout(800);
check("  result after consent", /review, edit and send/.test(results.get(pid)?.result ?? ""), results.get(pid)?.result);
const dlg = page.locator("dialog.enquiry-dialog[open]");
check("  enquiry dialog open", await dlg.count() === 1);
const posted = [];
page.on("request", (q) => { if (q.url().includes("/api/enquiry")) posted.push(q.url()); });
await page.waitForTimeout(1000);
check("  nothing submitted automatically", posted.length === 0);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

r = await tool("open_contact", { focus: "website" });
check("open_contact opens the dialog", await page.locator("dialog.enquiry-dialog[open]").count() === 1, r?.result);
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

await page.getByRole("button", { name: /end conversation/i }).click();
await page.waitForTimeout(900);
check("end removes the panel", await page.locator(".voice-panel").count() === 0);
check("  presence back to dormant", (await page.locator(".site-header").getAttribute("data-presence")) === "dormant", await page.locator(".site-header").getAttribute("data-presence"));

log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
await browser.close();
process.exit(fails ? 1 : 0);
