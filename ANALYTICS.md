# Analytics

Google Analytics 4 — property `velabuilt.com`, web stream "VelaBuilt website",
Measurement ID `G-YYQMTMZ6YB` (account owner: pagiwakudzayi@gmail.com).

Enabled by the env var `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Production only on
Vercel). Unset → no Google script loads at all (dev, previews).

## Privacy configuration

- `client_storage: 'none'` — no cookies, no localStorage/sessionStorage.
  Client id is random and in-memory per tab: returning visitors count as new.
- `ad_storage`, `ad_user_data`, `ad_personalization` denied; Google signals and
  ad personalisation off.
- No personal data in events. Never names, emails, messages or answer text.

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

Clicks are captured by one delegated listener in
`src/components/chrome/Analytics.tsx`; mark new demo regions with
`data-demo="name"` and they report automatically.

Plus GA enhanced measurement: page views (incl. client-side navigation),
scrolls, outbound clicks, form interactions.
