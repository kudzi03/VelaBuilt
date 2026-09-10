# Implementation Status

Last updated: 2026-09-10

## State

The site is **built, verified and runnable**. Every route renders, every tier
degrades correctly, the enquiry endpoint works end to end, and the checks below
pass. It is ready for content review and a staging deploy.

```bash
npm install
npm run dev            # http://localhost:3000
npm run check          # typecheck + lint + build
```

## Done

**Architecture** — Next.js 16 / React 19 / TypeScript, four separated layers,
typed content as the single source of truth. Type errors fail the build.

**The journey** — six chapters as one continuous camera through one corridor.
Scroll maps to the chapter sections themselves, so the camera arrives when the
reader does. Chapter changes are motivated by thresholds the camera physically
passes through. Scroll is never hijacked; every chapter is an anchor and the
journey can be skipped.

**The world** — hand-written materials (lit stone, champagne seams, additive
bloom, black glass), instanced ribs, distance culling, one clock, full
disposal, no post-processing, no shadow maps, three lights,
`frameloop="demand"`, DPR capped per tier, responsive field of view.

**The Operator** — procedural licence-free rig, gait driven by real scroll
velocity, isolated behind one component and a three-value contract so a
production character swaps in without touching anything else.

**Progressive enhancement** — Tier A (full corridor), Tier B (phones and
tablets: fewer stations, lower DPR, simplified geometry), Tier C (reduced
motion, no WebGL, constrained device, data saver, or no JavaScript — the CSS
world, with identical content). Verified, not assumed.

**Content** — three offers with problems, capabilities, process and explicit
boundaries; ten System Lab modules with sequences, connections and stated human
oversight; work split into three labelled categories; scoped FAQs. No fabricated
proof anywhere; what the site does not claim is stated in the footer, on
`/about` and in `/llms.txt`.

**Start a Project** — four steps, branching on the first answer, native
`<dialog>` for focus trapping and Escape, a real `/start` route underneath that
works without JavaScript reaching it, `?focus=` deep links, inline validation,
and a confirmation that shows the enquiry entering a real process.

**Server** — isolated inbound endpoint with ordered checks, strict schema,
silent bot screening, rate limiting, signed webhook delivery, adapter boundary,
no personal data in logs.

**SEO / AEO / GEO** — per-route metadata and canonicals, one entity graph,
Service / Breadcrumb / FAQ / CollectionPage / AboutPage schema, generated
sitemap and robots, `llms.txt`, answer-first copy, internal linking.

**Accessibility** — semantic headings (21 on the homepage), keyboard operable
throughout, visible champagne focus rings, skip link, labelled forms with
inline errors, `aria-live` step announcements, focus moved to each new question,
reduced-motion honoured, decorative layers hidden from assistive technology.

**Security** — full header set, CSP (with its one compromise documented),
validated environment, no client-side secrets, no cookies, no third-party
scripts, `npm audit` clean.

## Verified

| Check | Result |
| --- | --- |
| `npm run build` | 17 routes, all static except `/api/enquiry` |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `scripts/qa.mjs` | 11 routes × desktop + phone: no overflow, no console errors, one `<h1>` per page, metadata and canonicals present, no text under 12px |
| `scripts/fallbacks.mjs` | Reduced motion, no WebGL, no JavaScript → Tier C, all content readable |
| Tier detection | Desktop → A, phone → B, forced failure → C |
| Enquiry endpoint | 10 cases incl. strict keys, cross-flow answers, honeypot, timing, rate limit |
| Structured data | Parses on every page with the expected types |
| Log hygiene | No submitted email present in server logs |
| 404 | Returns 404 with the designed page |

## Bugs found and fixed during QA

Recorded because each was invisible to inspection and only appeared in a real
browser:

1. `body` had an opaque background, which paints over a `z-index: -10` element.
   The 3D world had been rendering correctly and was completely covered.
2. Colours were converted sRGB → linear twice, darkening the entire scene.
3. Long light seams used a radial glow falloff, lighting only their middle.
4. The horizon's light band sat below the floor; its quad edge was visible.
5. With JavaScript off, every `.reveal` section stayed invisible.
6. The text shield's negative inline inset caused 40px of horizontal scroll on
   phones.
7. Labels rendered at 9.3–10.9px.
8. Desktops were being classified Tier B.
9. `--grain-url` was never defined, so film grain never rendered.
10. Camera path and station coordinates disagreed, so the camera overshot the
    final station.

## Not done, and why

- **No client work is published.** There is none to publish. `/work` says so in
  plain language rather than filling the space. This is deliberate.
- **No production character model.** The procedural rig is in place and the
  swap contract is documented in `CREATIVE_SYSTEM.md`.
- **No analytics.** None was specified, and adding one would change `/privacy`
  and the CSP. Straightforward to add when chosen.
- **No CMS.** Content is typed data. Appropriate at this size; if non-technical
  editing becomes a requirement, `content/` is the seam to replace.
- **No automated test suite.** The QA scripts cover the behaviours that matter
  for a marketing site. Unit tests would be worth adding alongside the schema
  and rate limiter if the server surface grows.
- **No environment audio.** Optional in the brief; unprompted audio is a
  liability more often than an asset.

## Next

1. Review the copy. It is written to be defensible, but the voice should be
   confirmed by whoever owns the brand.
2. Set `NEXT_PUBLIC_SITE_URL` and deploy to staging.
3. Run Lighthouse against the deployed origin — the local checks confirm
   structure and behaviour, not field metrics.
4. Decide the enquiry destination and configure `ENQUIRY_ADAPTER=webhook`
   against a **new** inbound workflow.
5. Commission the character asset (spec in `CREATIVE_SYSTEM.md`).
6. Supply the authoritative monogram artwork to replace the redrawn vector.
