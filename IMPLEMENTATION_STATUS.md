# Implementation Status

Last updated: 2026-09-22 (Vela: the object and the voice guide)

## State

Built, verified locally, and ready to deploy. The object, the voice guide,
the light redesign and the new service pages are in. The walkable world and
three.js are gone.

```bash
npm install
npm run check          # typecheck + unit tests + lint + build
```

## Done

**The object** — `src/vela/`. Raw WebGL2, no three.js. 240 nodes that
rebuild into six forms (armature, planes, aperture, circuit, lattice, frame)
as the visitor moves through the site, with seven presence states for the
voice guide. Server-rendered SVG first frame; two quality tiers; adaptive
resolution; sleeps when hidden or covered; draws only on change under reduced
motion; falls back to the still on any GL failure.

**Vela, the voice guide** — `src/voice/` on `@elevenlabs/react`. Consent
before the microphone, text mode, mute, end, Escape. Seven enumerated client
tools that move the site; prefill waits for the visitor and never submits.
A new agent, duplicated from the original, which is untouched. See WORLD.md.

**The site** — light design system (Archivo + Geist Mono, self-hosted), new
home as one space with four capability chapters, work, answers and contact.
New `/ai-systems` and `/business-systems` pages. Every inner page carries a
chapter for the object and a solid reading sheet.

**Discoverability** — `WebPage`, `Service` and `FAQPage` schema on the home
page, answer-first FAQs, `/llms.txt` generated from content, a new social
card drawn from the same geometry. The unverifiable "4–10 weeks" claim was
removed.

## Verified

Checks run against a local production build (`next start`):

| Check | Result |
| --- | --- |
| `npm test` | 10/10 (tool rails, geometry) |
| typecheck, lint | clean |
| `scripts/qa.mjs` | 15 routes × 6 widths clean: no console errors, no overflow, one h1, no text under 12px, JSON-LD parses, WebGL goes live. No-JS, reduced motion, keyboard walk, enquiry dialog, voice consent and mic-refused path all clean |
| `scripts/contrast.mjs` | 1,825 text runs across 14 routes, no failures |
| `scripts/voice-tools.mjs` | 23/23: real SDK against a mocked ElevenLabs socket |
| ElevenLabs agent tests | 6 tests × 3 runs, 18/18 |

### Performance, before and after

Lighthouse 12 against a local production build of the home page, same
machine, same flags, software WebGL (SwiftShader). Absolute numbers are
pessimistic; the comparison is like for like. "After" is the median of three
runs.

| | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | --- | --- | --- | --- |
| Performance | 0.49 | 0.71 | 0.67 | 0.81 |
| LCP | 5.5 s | 2.9 s | 1.1 s | 0.6 s |
| Total blocking time | 5,610 ms | 1,330 ms | 1,500 ms | 430 ms |
| FCP | 0.9 s | 1.0 s | 0.3 s | 0.3 s |
| CLS | 0 | 0 | 0 | 0 |
| Page weight | 583 KiB | 295 KiB | 625 KiB | 322 KiB |
| Accessibility / SEO / Best practices | 1 / 1 / 1 | 1 / 1 / 1 | 1 / 1 / 1 | 1 / 1 / 1 |

Home initial JS (raw bytes of every script tag, including the 112 KB
`noModule` polyfill modern browsers skip): 627,505 → 617,883. The framework
is ~415 KB of that; site code in the initial load is ~33 KB. The WebGL
renderer and the ElevenLabs SDK are both dynamic imports: the renderer at
idle, the SDK only after the visitor chooses to talk.

What moved the numbers, found by profiling rather than guessed:

1. The first screen was hidden behind a JS-gated entrance, so LCP waited for
   hydration. It now arrives with a CSS-only animation that never touches
   opacity.
2. A throwaway WebGL probe context was created during hydration (672 ms on
   software GL). Removed; the renderer creates its one context at idle.
3. Renderer boot was one 1.2 s task. It is now split across frames, with
   shaders compiled through `KHR_parallel_shader_compile` where available.

## Not done, or not verifiable here

- **A live spoken conversation was not tested from the build sandbox.** It
  cannot open outbound WebSockets or WebRTC. The agent's decisions were tested
  on ElevenLabs and the site's handling against a mocked socket; the two
  halves meet only on the live site. Talk to it on velabuilt.com.
- **Enquiry capture in production** depends on a Vercel Blob store or SMTP
  password being set in the Vercel project. The route never reports success
  unless one of them actually took the enquiry; without either, the visitor
  is told plainly and given the email address.
- **No `ELEVENLABS_API_KEY` in Vercel.** Vela runs on the public agent id,
  gated by the allowlist. Adding the key switches to server-minted tokens with
  no code change.
- Numbers above are from software GL; real-device field data will differ.

## Next

1. Talk to Vela on the live site, on a phone and a laptop, and listen for
   latency and interruptions.
2. Add `ELEVENLABS_API_KEY` (convai scope) to Vercel.
3. Connect a Blob store if one is not already set.
4. Publish the next case study; it becomes a `show_project` value.
