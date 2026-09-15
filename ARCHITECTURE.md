# Architecture

VelaBuilt.com — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4,
React Three Fiber.

## The rule everything else follows

**The cinematic layer decorates the website. It is not the website.**

Every word, link, heading and control exists in semantic HTML. The environment
is a fixed backdrop behind that HTML. Delete the canvas and the site is intact:
same content, same structure, same outline. This is verified on every change by
`scripts/fallbacks.mjs`.

## The pipeline

The environments are photographic. The five supplied architectural renders are
the production art, and everything a still cannot do is layered around them:

| Layer | Technique |
| --- | --- |
| Environment | Cinematic plate, AVIF/WebP, responsive widths, ~67 KB at full width |
| Camera | Virtual camera in the shader: cover framing, focal push, drift |
| Depth | Analytic depth ramp per scene, driving real parallax |
| Light | Luminance-keyed bloom, per-scene grade, atmospheric haze |
| Interaction | Selective room dimming and illuminated chains (System Lab) |
| Transitions | Light-led dissolve keyed off the incoming room's own luminance |

Building an approximation of these rooms from primitives was tried first and
abandoned: it could not reach the fidelity of the references, and the frame
budget is far better spent grading real architecture than drawing a worse
version of it. See VISUAL_RECONSTRUCTION_PLAN.md.

Plates are regenerated with `node scripts/build-plates.mjs <source dir>`.

## Four layers

```
src/content/     SEMANTIC CONTENT   typed data: the entity, offers, systems, work, FAQs
src/components/  PRESENTATION       pages, chapters, UI, the enquiry flow
src/components/cinematic/  3D       the corridor, camera, Operator, stations
src/app/api/, src/lib/   SERVER     validation, rate limiting, integration adapters
```

Dependencies run one way: content knows nothing about presentation;
presentation knows nothing about the 3D layer; the 3D layer knows nothing about
the server.

## Content layer

`src/content/` is the single source of truth. Pages, navigation, sitemap,
structured data and copy all derive from it, so the entity cannot drift between
them — the same description of VelaBuilt reaches a reader, a crawler and a
language model.

| File | Holds |
| --- | --- |
| `site.ts` | The entity: name, description, capabilities, navigation, and what the site does not claim |
| `services.ts` | The three commercial offers, each with problems, capabilities, process and an explicit boundary |
| `systems.ts` | System Lab modules, their sequences, their connections, and what a person still decides |
| `work.ts` | Work items and the three category definitions |
| `faq.ts` | FAQs, scoped per page. Only rendered questions are eligible for schema |
| `scenes.ts` | The plates: framing, depth model, camera move and grade per chapter |
| `enquiry-flow.ts` | The enquiry questions and branching, shared by client and server |

## The journey

The homepage is one continuous camera travelling one corridor, divided into six
chapters. `src/lib/journey.ts` defines them once; both the DOM sections and the
3D stations are built from that array, so a chapter and its station are the
same place.

```
Scene 01 Friction         disconnected systems, nothing joined up
Scene 02 The Website      the architecture becomes an interface
Scene 03 The Lost Enquiry one enquiry: stalling, then running a path
Scene 04 System Lab       a room of connected modules
Scene 05 Discoverability  one entity, and everything that must understand it
Scene 06 Destination      one architecture, and the horizon
```

### How scroll drives it

`JourneyDriver` is the only place scroll is read. One passive listener records
position; one rAF loop damps it and writes to a plain object (`journey`) that
the render loop reads every frame.

**No scroll handler calls `setState`.** Scroll never triggers a React render,
which is why the page stays smooth while a corridor is drawn behind it. React
components subscribe only to *chapter changes*, which are rare.

Scroll is never hijacked. Wheel, trackpad, keyboard, scrollbar and anchor links
behave exactly as on any other page; the camera follows where the visitor
already is. Every chapter is a real anchor, so the journey can be skipped.

Progress maps to the chapter sections themselves, not linearly — chapters are
very different heights, and a linear map would put the camera in the wrong room
while the reader is in the right one.

## The 3D layer

```
CinematicStage        decides the tier, mounts the compositor at idle
├── CssPlate          the plate as a plain image — first paint, and all of Tier C
├── PlateSequence     Tier C's journey: the same rooms, crossfading
├── PlateCanvas       the WebGL2 plate compositor (dynamic import, ssr: false)
│   ├── Compositor    blends two scenes' camera and grade into the shader
│   ├── plateShader   framing, parallax, bloom, haze, grade, dissolve, dimming
│   └── plateTextures lazy load, two resident, disposed when walked away from
└── JourneyDriver     scroll → journey
```

`PageBackdrop` puts the same rooms behind the inner pages, held well back.

Design decisions that matter:

- **One full-screen quad.** No scene geometry, no lights, no shadow maps, no
  post-processing pass. The whole environment is one draw call.
- **`frameloop="demand"`** — frames stop entirely when the run leaves the view.
- **Two plates resident.** A decoded plate is ~6 MB of GPU memory; only the
  current room and the one being walked into are kept, and the rest are freed.
- **The camera holds** on the outgoing room until the next plate has decoded,
  so a slow network never dissolves into black.
- **Cover framing matches CSS `object-position`,** so the canvas and the image
  fallback frame each room identically.

## Routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | Static | The journey |
| `/website-conversion-systems` | Static | Offer 01 |
| `/lead-follow-up-systems` | Static | Offer 02 |
| `/website-engine-optimization` | Static | Offer 03 |
| `/system-lab` | Static | Interactive system demonstrations |
| `/work` | Static | Client work, concepts, system demos |
| `/approach` | Static | How a project runs |
| `/about` | Static | The entity |
| `/start` | Static | The enquiry, as a real page |
| `/privacy` | Static | What the site collects |
| `/api/enquiry` | Dynamic | Inbound enquiries (POST only) |

Every page stands alone. None depends on having seen the homepage animation.

### Adding a service page

1. Add the entry to `services.ts`.
2. Create `src/app/<slug>/page.tsx` — ten lines, wrapping `ServicePage`.
3. Nothing else. Sitemap, navigation, internal links, schema and the homepage
   index all follow from the content.

Routes designed for but not yet built: `/automation`, `/ai-systems`,
`/crm-automation`, `/booking-systems`, `/industries/[vertical]`.

## Commands

```bash
npm run dev            # development
npm run build          # production build (type errors fail the build)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run check          # all three

bash scripts/serve.sh          # restart the production server on :3000
node scripts/qa.mjs            # every route, desktop + phone
node scripts/fallbacks.mjs     # reduced motion, no WebGL, no JavaScript
node scripts/interaction.mjs   # keyboard walk + the whole enquiry flow
node scripts/peek.mjs 0 0.5 1  # capture the world at points in the journey
```
