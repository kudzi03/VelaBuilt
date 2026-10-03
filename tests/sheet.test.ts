import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { appendToSheet, literal, sheetRow, SHEET_COLUMNS } from "../src/lib/enquiry/sheet";
import type { EnquiryRecord } from "../src/lib/enquiry/adapter";

const record: EnquiryRecord = {
  reference: "VB-2026-TEST01",
  receivedAt: "2026-09-22T20:31:05.123Z",
  focus: "automation",
  answers: {},
  name: "=HYPERLINK(\"http://evil\")",
  email: "someone@example.com",
  company: "Roofing Co",
  message: "+1 please chase our quotes",
  consent: true,
  elapsedMs: 9000,
};

test("cells that Sheets would run as formulas are stored as text", () => {
  assert.equal(literal("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(literal("+263 77 000"), "'+263 77 000");
  assert.equal(literal("-5"), "'-5");
  assert.equal(literal("@home"), "'@home");
  assert.equal(literal("Plain text"), "Plain text");
});

test("a row has one cell per column, in order, formulas neutralised", () => {
  const row = sheetRow(record, "velabuilt.com/start");
  assert.equal(row.length, SHEET_COLUMNS.length);
  assert.equal(row[0], "2026-09-22 20:31:05");
  assert.equal(row[1], "VB-2026-TEST01");
  assert.equal(row[4], "'=HYPERLINK(\"http://evil\")");
  assert.equal(row[5], "someone@example.com");
  assert.equal(row[7], "");
  assert.equal(row[8], "'+1 please chase our quotes");
});

/** Behaves like an Apps Script web app: POST → 302 → GET returns the output. */
function fakeAppsScript(respond: (body: { secret?: string }) => string): Promise<{ url: string; server: Server; received: unknown[] }> {
  const received: unknown[] = [];
  let pending = "";
  const server = createServer((req, res) => {
    if (req.method === "POST") {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        const body = JSON.parse(data) as { secret?: string };
        received.push(body);
        pending = respond(body);
        res.writeHead(302, { location: "/echo" });
        res.end();
      });
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(pending);
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ url: `http://127.0.0.1:${port}/exec`, server, received });
    }),
  );
}

test("a confirmed append resolves with the row number", async () => {
  const fake = await fakeAppsScript((b) =>
    JSON.stringify(b.secret === "s".repeat(32) ? { ok: true, row: 7 } : { ok: false, error: "unauthorised" }),
  );
  try {
    const result = await appendToSheet(record, { url: fake.url, secret: "s".repeat(32), source: "test" });
    assert.equal(result.row, 7);
    assert.equal(fake.received.length, 1);
  } finally {
    fake.server.close();
  }
});

test("a wrong secret, an error page or no secret all throw — never a false success", async () => {
  const refuse = await fakeAppsScript(() => JSON.stringify({ ok: false, error: "unauthorised" }));
  const html = await fakeAppsScript(() => "<html>Sorry, unable to open the file</html>");
  try {
    await assert.rejects(appendToSheet(record, { url: refuse.url, secret: "x".repeat(32), source: "t" }), /unauthorised/);
    await assert.rejects(appendToSheet(record, { url: html.url, secret: "x".repeat(32), source: "t" }), /not JSON/);
    await assert.rejects(appendToSheet(record, { url: refuse.url, secret: undefined, source: "t" }), /SECRET/);
  } finally {
    refuse.server.close();
    html.server.close();
  }
});
