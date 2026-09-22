# The VelaBuilt facility — build notes and handover

Internal. Branch `claude/velabuilt-world`.

If you are picking this up cold, read this before touching anything. It is the
checkpoint, not a summary.

---

## What exists right now

A walkable first-person building, mounted over the home page, dismissible back
to the conventional site at any moment.

| File | What it is |
|---|---|
| `src/world/facility.ts` | The plan, in metres. Halls, corridors, solids, floor heights, the route. **No three.js** — the collision solver and the voice guide both read it without a renderer. |
| `src/world/player.ts` | Walking: mass, sliding contact, gait, no jump/crouch/sprint. |
| `src/world/input.ts` | Pointer lock + keyboard + floating touch stick. |
| `src/world/materials.ts` | Runtime-generated PBR surfaces and a PMREM environment. Nothing downloaded. |
| `src/world/scene.ts` | Geometry, cove lighting, one moving shadow map. |
| `src/world/state.ts` | The context bridge — where the visitor is, coarse-grained. |
| `src/world/pointer.ts` | Coarse-pointer media query as an external store. |
| `src/components/world/WorldStage.tsx` | Door, threshold, HUD, mobile layer, standard-view escape. |
| `src/components/world/WorldCanvas.tsx` | The R3F mount and the frame loop. |
| `src/components/world/WorldBoundary.tsx` | Context failure → close the world, keep the page. |

### The spine

The six halls **are** the six gates in `src/content/signal-path.ts`. Add a gate
without giving a hall `gate: "<id>"` and `facility.ts` throws at module load —
deliberately, so the walked world and the scrolled page can never disagree
about what the system does.

### Verified on a rendered frame, not assumed

- Door → threshold → world → walking → guided navigation all work.
- Zero console errors and zero page errors through the whole flow.
- Build, typecheck and lint all clean.
- Screenshots in the session scratchpad: `w-atrium.png`, `w-intake.png`,
  `w-deep.png`.

---

## Not done yet

Listed honestly, in the order I would do them.

### 1. ElevenLabs voice guide — BLOCKED ON CREDENTIALS

**This session has no ElevenLabs access.** There is no ElevenLabs MCP server
attached, no key in the repo, and nothing in `.env.example`. The brief said
access would be given; it has not arrived, so nothing has been built against a
real agent, and I have not guessed at an agent id or written a fake integration.

What is already in place for it: `src/world/state.ts` is the context bridge the
guide is meant to read (`hall`, `focus`, `entered`, `muted`, `voice`), and the
threshold already offers "Enter with the guide" / "Enter silently" as two equal
choices with no microphone request on load.

What is needed to finish it:

- `ELEVENLABS_API_KEY` (server-side only — never `NEXT_PUBLIC_`)
- the agent id of the existing agent
- confirmation to edit that agent's prompt

Then: a server route that mints a short-lived signed URL, a client that opens
the conversation only after the visitor asks for it, a tool/context channel
that posts `worldContext.hall` on change, and a small closed set of actions
(`navigate(hall)`, `openProject(slug)`, `showEnquiry()`, `exitToStandard()`)
dispatched through a switch — never arbitrary DOM access.

### 2. Audio

Not started. The plan: procedurally synthesised room tone per hall (`Hall.tone`
already exists in the spec), footsteps driven by `PlayerState.distance`, and
positional sources on the rack room and the pendulums. Generated with the Web
Audio API rather than downloaded, for the same reason the textures are.
Everything behind the existing mute state.

### 3. Interactive objects and the gallery plinths

`records` hall builds three empty plinths. What stands on them must come from
`src/content/work.ts` — the real Cardio Life project and the demos — and must
never render an invented client. Nothing is placed yet.

### 4. Mobile pass on a real device

The touch stick and drag-look are implemented and the HUD is laid out for it,
but it has not been driven on a phone or in a device emulator. Do this before
production.

### 5. Performance measurement

Not measured. The architecture is built for it — six draw calls for the shell,
one shadow map, no post-processing, nothing downloaded — but "built for it" is
not a number. Measure first frame, steady-state fps and heap on a mid-range
Android before shipping.

---

## Things that will bite you

- **React Compiler vs three.js.** `react-hooks/immutability` is disabled in
  `WorldCanvas.tsx` only, with the reason written at the top of the file. The
  rule protects React's data flow; a scene graph is mutable by design. Do not
  remove the disable without reading that note — and do not add it to any other
  file.
- **The rig is a lazy `useState` initialiser**, not a ref. Reading a ref during
  render to mount `<primitive>` is the hazard the ref rule exists to catch.
- **Never mutate `scene`.** Every material already carries the envMap, so
  `scene.environment` is not needed. Fog and background are set in `onCreated`,
  outside React's render.
- **Headless WebGL in this container** needs
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader
  --disable-gpu-sandbox`. Without them three.js throws and you will think the
  world is broken when it is not. Playwright's actionability check also calls
  the buttons "unstable" over a live canvas — use `{ force: true }` in QA
  scripts; real clicks are fine.
- **Software GL is slow.** The threshold takes ~8 s under swiftshader. On real
  hardware it is a fraction of that. Do not tune loading against the container.

---

## What was deliberately not done, and why

- **No downloaded 3D assets or texture sets.** The brief's hard performance
  requirement and the licence constraint point the same way, and a photoreal
  interior comes from roughness, environment and falloff rather than from
  megabytes.
- **No physics engine.** The architecture is axis-aligned, so collision
  resolution is exact in a few comparisons. Rapier would be ~400 KB to solve a
  solved problem.
- **No bloom or post-processing.** On a near-black interior it is the
  cheapest-looking effect available and it eats the contrast that makes the
  halls feel deep.
- **The reference repositories were studied for technique, not copied.** No
  code and no assets from `gonzalo123/museum`, `Armando-ic/portfolio`,
  `kwiruu/portfolio` or `dhruvm-04/VirtualTour` are in this branch. Everything
  here is written against this codebase's own conventions.

---

## Nothing invented

No clients, projects, outcomes, statistics or testimonials have been added.
The only real client in the repository is Cardio Life and it remains the only
one. The gallery plinths are empty furniture waiting for content that already
exists in `src/content/work.ts`.
