# Analytics

Google Analytics 4 — property `velabuilt.com`, web stream "VelaBuilt website",
Measurement ID `G-YYQMTMZ6YB` (account owner: pagiwakudzayi@gmail.com).

## How it works (first-party, cookie-free)

Browser → `POST /api/track` (same origin, `sendBeacon`) → server validates
against the allowlist in `src/lib/analytics.ts` → GA4 Measurement Protocol.

- No Google script in the browser. CSP stays `connect-src 'self'` (+ voice).
- No cookies, no local/session storage. Visit id is random, in-memory per tab;
  returning visitors count as new users.
- Server adds country/region from Vercel edge headers and a device category
  from the user agent. The IP address is never forwarded.
- Bots (by user agent) are dropped; 120 events/min per address.

## Environment (Vercel, Production only)

| Var | Value |
|---|---|
| `NEXT_PUBLIC_ANALYTICS` | `1` — turns the client beacons on |
| `GA_MEASUREMENT_ID` | `G-YYQMTMZ6YB` |
| `GA_API_SECRET` | Measurement Protocol secret (GA Admin → Data streams → stream → Measurement Protocol API secrets). Sensitive. |

Unset in dev/preview → nothing is sent.

## Known limits vs. the standard tag

- Traffic source/medium attribution is weaker: the first page view carries
  `page_referrer` and `entry_referrer`, and UTM tags survive in
  `page_location`, but GA's automatic channel grouping is less reliable than
  with gtag. Use the `entry_referrer` custom dimension for "where from".
- Users = visits (no returning-user recognition).

## Events

| Event | Fires when | Params | Key event |
|---|---|---|---|
| `generate_lead` | `/api/enquiry` accepted an enquiry | `enquiry_focus`, `method` | **Yes** |
| `enquiry_error` | enquiry rejected / failed | `enquiry_focus`, `status` | |
| `start_project_click` | any link to `/start` | `link_location`, `link_text`, `enquiry_focus` | |
| `email_click` | `mailto:` link | `link_location` | Yes |
| `phone_click` | `tel:` link (none on site yet) | `link_location` | Yes |
| `whatsapp_click` | wa.me / whatsapp link (none yet) | `link_location` | Yes |
| `book_call_click` | Calendly/Cal.com/Google booking link (none yet) | `link_location` | Yes |
| `vela_talk_click` | a Talk to Vela control pressed | `page_path` | |
| `vela_conversation_start` | Vela connected | `mode`, `page_path` | Yes |
| `demo_interaction` | click inside any `[data-demo]` region (System Lab) | `demo` | |

Page views and clicks are captured in `src/components/chrome/Analytics.tsx`; mark new demo regions with
`data-demo="name"` and they report automatically.

Plus `page_view` on every navigation (incl. client-side), `session_start` on
the first event of a visit, and `scroll` at 90% depth.

Register `enquiry_focus`, `link_location`, `entry_referrer` and `demo` as
event-scoped custom dimensions in GA Admin so they appear in reports.
