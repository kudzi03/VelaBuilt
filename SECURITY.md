# Security

This is a public marketing site with exactly one write surface. The design goal
is that the blast radius of that surface stays small and obvious.

## Secrets

**No credential is ever exposed to the browser.** The only variable readable by
client code is `NEXT_PUBLIC_SITE_URL`, which is public by definition.

`lib/env.ts` validates the server environment with Zod and is **server-only** —
importing it from a client component is a build error. It fails loudly at the
boundary rather than running half-configured.

The site runs correctly with no credentials set at all: the enquiry endpoint
falls back to the logging adapter. Adding a credential activates its
integration and nothing else.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin. Public. |
| `ENQUIRY_ADAPTER` | No | `log` (default) or `webhook` |
| `ENQUIRY_WEBHOOK_URL` | With `webhook` | Server-to-server inbound endpoint |
| `ENQUIRY_WEBHOOK_SECRET` | No | HMAC-SHA256 signing key, min 24 chars |
| `ENQUIRY_NOTIFY_EMAIL` | No | Notification destination |

Never place a CRM key, Airtable PAT, n8n credential, model-provider key, email
or calendar credential, or a Supabase service-role key anywhere a
`NEXT_PUBLIC_` prefix could reach.

## The enquiry endpoint

`POST /api/enquiry` is the only route that accepts input. Checks run cheapest
first:

1. **Method and content type** — anything but `POST` with JSON is rejected
   (`405` / `415`) before parsing.
2. **Body size** — capped at 16 KB, checked against both the declared
   `Content-Length` and the actual body.
3. **Rate limit** — 5 submissions per 10 minutes per client key.
4. **Schema validation** — Zod, `.strict()`. Unknown keys are rejected, not
   stripped. Strings have control characters removed and lengths clamped.
   Answers are validated *against the flow the chosen focus actually produces*,
   so an answer belonging to a different branch is refused.
5. **Bot screening** — a honeypot field and a minimum completion time. Both
   return a normal-looking `202` and deliver nothing, so a bot learns nothing
   from the response.
6. **Delivery** — through an adapter, time-boxed at 8 seconds. A hanging
   integration is an outage.

Verified behaviour (re-runnable with curl against a local build):

| Input | Response |
| --- | --- |
| Valid submission | `201` with a reference |
| Invalid email | `422` with a field-level message |
| Answer from another branch | `422`, refused |
| Unknown key (`isAdmin`) | `422`, refused |
| Message over 2000 chars | `422`, refused |
| Honeypot filled | `202`, nothing delivered |
| Submitted in under 3s | `202`, nothing delivered |
| 6th request in 10 minutes | `429` with `Retry-After` |
| `GET` | `405` |
| `text/plain` | `415` |

### Logging

Enquiry contents are **never** logged. The log line carries the reference, the
focus, the number of answers, whether optional fields were present, and a
timestamp — no name, no email, no message. Confirmed by grepping server logs for
a submitted address after testing.

Delivery failures log the reference and the error message only, and return a
`502` telling the visitor to email directly so the enquiry is not silently lost.

## Isolation from existing VelaBuilt systems

This inbound path is **deliberately separate**. It does not read from, write to,
or call:

- the VelaBuilt Acquisition OS,
- the existing W1–W5 outbound workflows,
- any existing production automation.

`lib/enquiry/adapter.ts` is the only file that knows an outside system exists,
and it knows about exactly one URL. Where future integrations connect is
documented in that file's header:

- **CRM** — implement `deliver()` to create Contact + Opportunity.
- **Airtable** — POST to a *dedicated inbound base*, with a PAT scoped to that
  base only, held server-side.
- **n8n** — POST to a **new** inbound webhook workflow (`W-IN-01`), never an
  existing outbound one.
- **Email** — transactional send to `ENQUIRY_NOTIFY_EMAIL`.
- **Calendar** — return a `bookingUrl` from the delivery result.

Rules for any adapter added: server-side only; never log personal fields; throw
rather than swallow a failure; time-box every outbound request.

Webhook deliveries are signed with HMAC-SHA256 over the exact bytes sent
(`x-velabuilt-signature`, plus `x-velabuilt-timestamp`), so the receiver can
reject anything not sent by this site.

## Headers

Set on every response in `next.config.ts`:

`Content-Security-Policy`, `Strict-Transport-Security` (2 years,
includeSubDomains, preload), `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (camera, microphone, geolocation and eleven others denied),
`Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-origin`. `X-Powered-By` is removed.

### The CSP compromise, stated plainly

`script-src` includes `'unsafe-inline'`. This is a real weakening and it is
deliberate.

The App Router's inline bootstrap and streaming payload require it on
statically rendered pages. The alternative — a nonce-based policy with
`'strict-dynamic'` — requires middleware to inject a per-request nonce, which
forces **every page to render dynamically** and gives up static generation, the
CDN cache and the LCP budget that the performance targets depend on.

What limits the practical risk:

- The site renders **no user-generated content**. Nothing a visitor supplies is
  echoed back into any page — the enquiry confirmation shows a server-generated
  reference and the first name the visitor typed, both React-escaped.
- All JSON-LD is generated server-side from typed content, never from input.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and
  `frame-ancestors 'none'` close the usual escalation routes.
- `connect-src 'self'` — the page cannot exfiltrate to another origin.
- There are no third-party scripts, tags, embeds or analytics of any kind.

**Upgrade path**, if a stricter policy is later worth the cost: add a middleware
that generates a nonce per request, sets
`script-src 'self' 'nonce-<n>' 'strict-dynamic'`, and passes it via the `x-nonce`
request header for Next to apply to its own scripts. Remove the `script-src`
line from `next.config.ts` at the same time so two policies do not intersect.
Expect every page to become dynamic; measure LCP before and after.

## Data

The site sets **no cookies** and loads **no third-party scripts**. There is no
analytics, no advertising pixel, no embed. `/privacy` describes exactly this and
is written against the implementation — if either changes, both change in the
same commit.

The rate limiter keeps a short-lived, in-memory record of requesting addresses.
It is not persisted, not linked to enquiries, and does not survive a restart.
Client identity for rate limiting comes from proxy headers, which are spoofable;
it is a throttle, never an authorisation decision.

## Known limits

- **The rate limiter is per-process.** It does not survive a restart and does
  not coordinate across instances. Before running more than one instance, swap
  the two functions in `lib/rate-limit.ts` for a shared store (Upstash Redis,
  Vercel KV, a Durable Object). Call sites do not change.
- **No CAPTCHA.** The honeypot and timing trap stop commodity spam. If a
  determined flood arrives, add Turnstile or hCaptcha at the endpoint — the
  screening function is already separate from schema validation for this reason.
- **`'unsafe-inline'` on `script-src`**, as above.

## If a client portal is ever added

Treat it as a **separate security boundary**: its own route group, its own
session handling, its own CSP, and no shared server code with the marketing
site beyond pure utilities. Authenticated pages must never be statically
generated. Nothing in this codebase currently establishes a session, and that
property is worth keeping deliberately.

## Maintenance

```bash
npm audit --omit=dev     # dependency advisories
npm run check            # types, lint, build
node scripts/qa.mjs      # every route, both viewports
node scripts/fallbacks.mjs
```
