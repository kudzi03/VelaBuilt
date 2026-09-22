/**
 * VelaBuilt enquiries → this Google Sheet.
 *
 * Paste into Extensions → Apps Script of the sheet that should receive the
 * enquiries, set SECRET, then Deploy → New deployment → Web app:
 *   Execute as: Me        Who has access: Anyone
 * Give the web-app URL to the site as ENQUIRY_SHEET_URL and the same secret
 * as ENQUIRY_SHEET_SECRET. See README.md next to this file.
 *
 * "Anyone" means anyone can reach the URL; only a request carrying SECRET
 * writes a row. The script runs as you, so nothing else needs credentials.
 */

// The shared secret. Must match ENQUIRY_SHEET_SECRET in Vercel exactly.
const SECRET = "PASTE-THE-SECRET-HERE";

// The tab enquiries are written to. Created on first use if missing.
const TAB = "Enquiries";

// Optional: also email a short alert for each new enquiry, sent from your own
// Google account (no SMTP password needed). Leave empty to switch off.
const NOTIFY_EMAIL = "";

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad request" });
  }

  if (!body || body.secret !== SECRET || SECRET === "PASTE-THE-SECRET-HERE") {
    return reply({ ok: false, error: "unauthorised" });
  }
  if (!Array.isArray(body.row) || !Array.isArray(body.columns)) {
    return reply({ ok: false, error: "bad request" });
  }

  // One writer at a time, so two enquiries in the same second both land.
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(body.columns.map(String));
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, body.columns.length).setFontWeight("bold");
    }

    // The site already neutralises anything that would read as a formula.
    const values = body.row.map(function (v) { return String(v); });
    sheet.appendRow(values);
    const row = sheet.getLastRow();
    sheet.getRange(row, 1, 1, values.length).setWrap(true).setVerticalAlignment("top");

    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: "New VelaBuilt enquiry " + values[1] + " — " + values[2],
          body: body.columns.map(function (c, i) { return c + ": " + (values[i] || ""); }).join("\n") +
            "\n\n" + ss.getUrl(),
        });
      } catch (mailErr) {
        // The row is written; a failed alert must not report failure.
      }
    }

    return reply({ ok: true, row: row });
  } finally {
    lock.releaseLock();
  }
}

// A GET to the URL just says the script is alive; it never exposes data.
function doGet() {
  return reply({ ok: true, service: "velabuilt-enquiries" });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
