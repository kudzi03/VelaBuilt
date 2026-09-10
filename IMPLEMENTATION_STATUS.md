# Implementation Status

Last updated: 2026-09-10 (visual reconstruction)

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

**The world** — the five supplied architectural renders, used as cinematic
plates and driven by a compositor: virtual camera with cover framing and focal
push, analytic depth parallax, luminance-keyed bloom, per-scene grade,
atmospheric haze, light-led dissolves between rooms, and selective dimming for
the System Lab. One full-screen quad, no scene geometry, no lights, no
post-processing pass, two plates resident at a time.

**The Operator** — the man in the plates. A real person in real architecture,
correctly lit, reflected and scaled. The procedural capsule rig is deleted.

**The System Lab** — rebuilt as the chamber itself. Stations sit on the
architecture; selecting one dims the rest of the room and runs light out along
the chain it hands off to. Module data, connections, oversight statements and
keyboard operation are unchanged from the previous build.

**Progressive enhancement** — Tier A (full compositor), Tier B (phones and
tablets: lower DPR, cheaper bloom, reduced parallax), Tier C (reduced motion,
no WebGL, constrained device, data saver, or no JavaScript — the same rooms as
plain responsive images, crossfading between chapters). Verified, not assumed.

**Mobile** — a designed portrait composition, not a shrunken desktop: the room
is held as a band across the upper frame at a legible scale with the copy on
solid ground beneath it, each room framed on the part of itself that survives a
phone crop, and the System Lab's labels move to a real control rail.

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
| `scripts/interaction.mjs` | Skip link first, 12 focus stops all named, visible and ringed; dialog opens, traps focus, closes on Escape, centres; flow branches, validates, submits and confirms |
| Contrast | Every text node meets WCAG AA against its real background |
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
11. The enquiry dialog opened pinned to the top-left corner: a modal
    `<dialog>` is centred by the UA's `margin: auto`, which the CSS reset
    zeroes along with every other margin.
12. `--color-faint` failed WCAG AA at body size on panel backgrounds.

### Found during the visual reconstruction

13. The compositor's cover fit divided by the scale instead of multiplying,
    sampling beyond the plate and smearing its edge pixels across the frame.
14. Framing was applied to the zoom pivot but not to the crop, so naming a
    focal point had no effect on what was actually in shot — which is why the
    portrait crop could not be corrected until the cover fit was fixed.
15. A backtick inside a GLSL comment terminated the shader's template literal.

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
