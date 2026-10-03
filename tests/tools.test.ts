import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAPABILITY_IDS,
  DESTINATIONS,
  PROJECTS,
  SECTIONS,
  SERVICE_AREAS,
  TOOL_NAMES,
  cleanSummary,
  parseToolCall,
} from "../src/voice/tools";
import { FOCUS_OPTIONS } from "../src/content/enquiry-flow";

test("every enumerated destination resolves to an internal route", () => {
  for (const [key, path] of Object.entries(DESTINATIONS)) {
    const r = parseToolCall("navigate_site", { destination: key });
    assert.ok(r.ok, key);
    if (r.ok && r.action.kind === "navigate") assert.equal(r.action.path, path);
    assert.match(path, /^\/[a-z0-9/-]*$/, "routes are internal paths only");
  }
});

test("unknown or hostile values are refused, never executed", () => {
  const hostile = [
    ["navigate_site", { destination: "https://evil.example" }],
    ["navigate_site", { destination: "javascript:alert(1)" }],
    ["navigate_site", { destination: "__proto__" }],
    ["navigate_site", { destination: "constructor" }],
    ["navigate_site", {}],
    ["scroll_to_section", { section: "#main; alert(1)" }],
    ["focus_service", { service: "discoverability" }],
    ["show_capability", { capability: "technical-seo" }],
    ["show_capability", { capability: "<img onerror>" }],
    ["show_project", { project: "acme_corp" }],
    ["run_javascript", { code: "alert(1)" }],
    ["navigate_site", null],
  ] as const;
  for (const [name, params] of hostile) {
    const r = parseToolCall(name, params);
    assert.equal(r.ok, false, `${name} ${JSON.stringify(params)} must be refused`);
  }
});

test("sections, services, projects and capabilities all parse", () => {
  for (const s of Object.keys(SECTIONS)) assert.ok(parseToolCall("scroll_to_section", { section: s }).ok);
  for (const s of Object.keys(SERVICE_AREAS)) assert.ok(parseToolCall("focus_service", { service: s }).ok);
  for (const p of Object.keys(PROJECTS)) assert.ok(parseToolCall("show_project", { project: p }).ok);
  for (const c of CAPABILITY_IDS) {
    const r = parseToolCall("show_capability", { capability: c });
    assert.ok(r.ok, c);
    if (r.ok && r.action.kind === "focus") assert.equal(r.action.capability, c);
  }
});

test("open_contact ignores an unknown focus rather than passing it on", () => {
  const r = parseToolCall("open_contact", { focus: "free-money" });
  assert.ok(r.ok);
  if (r.ok && r.action.kind === "contact") assert.equal(r.action.focus, undefined);
  for (const f of FOCUS_OPTIONS) {
    const ok = parseToolCall("open_contact", { focus: f });
    assert.ok(ok.ok && ok.action.kind === "contact" && ok.action.focus === f);
  }
});

test("prefill requires a summary, strips control characters and caps length", () => {
  assert.equal(parseToolCall("prefill_enquiry", { service: "website" }).ok, false);
  assert.equal(parseToolCall("prefill_enquiry", { service: "website", summary: "   " }).ok, false);
  const r = parseToolCall("prefill_enquiry", { service: "nonsense", summary: "Plumber\u0000 in Leeds.\u0007" });
  assert.ok(r.ok && r.action.kind === "prefill");
  if (r.ok && r.action.kind === "prefill") {
    assert.equal(r.action.message, "Plumber in Leeds.");
    assert.equal(r.action.focus, "not-sure");
  }
  assert.equal(cleanSummary("x".repeat(5000))!.length, 1200);
});

test("tool names are the seven the agent is configured with", () => {
  assert.deepEqual([...TOOL_NAMES].sort(), [
    "focus_service",
    "navigate_site",
    "open_contact",
    "prefill_enquiry",
    "scroll_to_section",
    "show_capability",
    "show_project",
  ]);
});
