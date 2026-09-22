# Enquiries → Google Sheets

Every enquiry from velabuilt.com (the form, `/start`, and anything Vela
pre-fills that the visitor then sends) is appended as one row to a Google
Sheet you own. The site says "received" only after the sheet confirms the
row; if the sheet cannot be reached, the visitor is told it did not send and
is given the email address instead.

Columns: Received (UTC) · Reference · Focus · Answers · Name · Email ·
Company · Website · Message · Source.

## Setup (about three minutes)

1. Create a Google Sheet (or open an existing one), e.g. "VelaBuilt enquiries".
2. **Extensions → Apps Script.** Delete what is there and paste the whole of
   [`Code.gs`](Code.gs).
3. Replace `PASTE-THE-SECRET-HERE` with the secret (the same value as
   `ENQUIRY_SHEET_SECRET` in Vercel). Save.
4. **Deploy → New deployment →** gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, and approve the permission prompt (it asks to edit your
     spreadsheets, because that is what it does).
5. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).
6. In Vercel → vela-built → Settings → Environment Variables, set
   `ENQUIRY_SHEET_URL` to that URL (Production and Preview), then redeploy.

The first enquiry creates an **Enquiries** tab with a bold, frozen header row.

## Optional: an email alert per enquiry

Set `NOTIFY_EMAIL` at the top of the script to your address and redeploy the
script (Deploy → Manage deployments → edit → New version). The alert is sent
from your own Google account, so no SMTP password is involved. The row is
written either way.

## Changing the script later

Edit, then **Deploy → Manage deployments → edit (pencil) → Version: New
version → Deploy**. Editing without a new version changes nothing live, and
creating a *new deployment* changes the URL.

## Security

- "Anyone" can reach the URL; only a request carrying the secret writes a
  row. Rotate by changing both the script constant and `ENQUIRY_SHEET_SECRET`.
- The site stores anything that Sheets would run as a formula (a value
  starting with `=`, `+`, `-` or `@`) as plain text.
- No Google credentials exist on the website. The script runs as you.
