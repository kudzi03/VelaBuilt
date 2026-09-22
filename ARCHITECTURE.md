# Architecture

VelaBuilt.com — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4,
raw WebGL2, `@elevenlabs/react`.

## The rule everything else follows

**The object decorates the website. It is not the website.**

Every word, link, heading and control exists in semantic HTML, in document
order. The structure behind the page is a fixed backdrop. Remove the canvas,
turn JavaScript off or reduce motion, and the site reads top to bottom as a
complete page. `scripts/qa.mjs` checks all three.

## Layers

```
src/content/     SEMANTIC CONTENT   typed data: the entity, services, work, FAQs, enquiry flow
src/components/  PRESENTATION       chrome, pages, capability cards, the enquiry dialog
src/vela/        THE OBJECT         geometry, shaders, renderer, chapter table, store
src/voice/       THE GUIDE          consent, the ElevenLabs session, the tool rails
src/app/api/     SERVER             enquiry intake, voice session minting
```

Dependencies run one way. Content knows nothing about presentation. The
object reads a tiny mutable store and knows nothing about React pages. The
voice layer moves the site only through `src/voice/tools.ts`, never by
reaching into components.

## Content layer

`src/content/` is the single source of truth. Pages, navigation, sitemap,
structured data and `llms.txt` all derive from it, so the entity cannot drift
between what a reader, a crawler and a language model are told. Vela's
knowledge base on ElevenLabs was written from the same files; when they
change, update it too (see WORLD.md).

| File | Holds |
| --- | --- |
| `site.ts` | The entity: name, tagline, descriptions, the four capabilities, navigation |
| `services.ts` | Five services, each with its area, chapter heading and capability items (`CAPABILITIES`) |
| `work.ts` | Cardio Life (client work) and Vela itself (system demo) |
| `faq.ts` | FAQs, scoped per page. Only rendered questions are eligible for schema |
| `enquiry-flow.ts` | The enquiry questions and branching, shared by client and server |
| `systems.ts` | System Lab modules |

## The object

One structure lives behind every page. It is not a scene per page; it is the
same 240 nodes rebuilding into a different form wherever the visitor is.

```
VelaStage (client, in layout)
├── .vela-bg / .vela-rings   CSS ground and the ring instrument
├── VelaStill                server-rendered SVG projection — first paint and fallback
├── canvas                   ArmatureRenderer, dynamic import at idle
├── .vela-hit                the button: "Talk to Vela"
└── driver                   scroll/pointer → vela store
```

| File | What it does |
| --- | --- |
| `geometry.ts` | Six shapes (armature, planes, aperture, circuit, lattice, frame) over one seeded node set. Nodes are rank-matched between shapes so each travels a short path; a union edge set carries a bitmask of the shapes each member belongs to |
| `shaders.ts` | Screen-space ribbon members with depth-of-field falloff, billboard nodes, amber core glow, fbm smoke, GPU-orbiting embers, glass facets |
| `renderer.ts` | `ArmatureRenderer`: morphs, energy pulses along edges, presence profiles, adaptive DPR, sleeping |
| `chapters.ts` | The placement table: which shape, where, how large, on desktop and phone, for every `data-chapter` |
| `store.ts` | The mutable `vela` object the render loop reads, plus a `useSyncExternalStore` bridge for the few React bits that care |

### Presence

`dormant · aware · connecting · listening · thinking · speaking · acting`.
Each has a profile (contraction, spin, spawn rate, flow direction, energy,
core glow). While a conversation is open, the SDK's input and output levels
feed in every frame through `vela.readLevels`, so the structure breathes with
the visitor's voice and brightens with Vela's.

### How scroll drives it

One passive listener. One rAF loop finds the `[data-chapter]` section under
the middle of the viewport and writes its entry from `CHAPTERS` into the
store. **No scroll handler calls `setState`**; React only hears about chapter
changes. Scroll is never hijacked, and every chapter is a real anchor.

Sections with class `sheet` are solid reading grounds that travel over the
object. When one covers the viewport, the renderer stops drawing.

### Performance posture

- Nothing WebGL is in the initial bundle. The renderer is a dynamic import
  started after `requestIdleCallback`; the SVG still is the LCP-safe first
  paint.
- Two tiers. `lite` (coarse pointers, viewports under 820px, ≤4 GB memory or
  ≤4 cores): lower DPR cap, fewer embers, pulses and smoke layers, finer
  nodes. Save-Data or no WebGL2 keeps the still only.
- Adaptive DPR drops resolution when frames run long, before anything else.
- Frames stop when the tab is hidden or a sheet covers the canvas. Under `prefers-reduced-motion` it renders only on change.
- Context loss falls back to the still, silently.

## The voice guide

See **WORLD.md** for the full handover. In short:

```
VoiceRoot (always mounted, tiny)     consent sheet, entry points, mode choice
└── VoiceSession (dynamic import)     ConversationProvider + the seven client tools
    └── tools.ts (pure)              parseToolCall: raw params → typed action or refusal
/api/voice/session                   token → signed URL → public agent id
```

The ElevenLabs SDK is not downloaded until the visitor has read the consent
sheet and pressed Start talking or Type instead.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | The one space: opening, four capability chapters, work, answers, contact |
| `/website-conversion-systems` | Digital Experiences |
| `/ai-systems` | AI Systems |
| `/lead-follow-up-systems` | Automation |
| `/business-systems` | Business Systems |
| `/website-engine-optimization` | Discoverability |
| `/work`, `/work/cardio-life` | Work, and the one published case study |
| `/approach`, `/about`, `/system-lab` | How a project runs, the studio, the lab |
| `/start` | The enquiry, as a real page |
| `/privacy`, `/cookies` | What the site and Vela collect |
| `/llms.txt` | Generated from content at build time |
| `/api/enquiry` | Inbound enquiries (POST only) |
| `/api/voice/session` | Mints a conversation credential (GET, rate-limited, no-store) |

### Adding a service page

1. Add the entry to `services.ts` with its `area` and `chapter`.
2. Create `src/app/<slug>/page.tsx` wrapping `ServicePage`.
3. If the voice guide should be able to open it, add it to `DESTINATIONS` in
   `src/voice/tools.ts` and to the `navigate_site` enum on the agent.

## Commands

```bash
npm run dev            # development
npm run check          # typecheck + unit tests + lint + production build
npm test               # tests/*.test.ts — tool rails and geometry

bash scripts/serve.sh          # production server on :3000
node scripts/qa.mjs            # every route × six widths, WebGL, no-JS, reduced motion, keyboard, dialogs
node scripts/contrast.mjs      # WCAG contrast on every rendered text run
```

`CHROME_PATH` points both scripts at a specific Chromium.
