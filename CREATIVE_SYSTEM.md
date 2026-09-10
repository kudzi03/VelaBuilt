# Creative System

The rules that keep VelaBuilt.com, the Instagram work and anything made later
looking like one universe.

## The idea

One camera travels one architectural space. A single figure — **the Operator** —
walks ahead of it. At the start he is working the machinery by hand; by the end
the machinery runs behind him and he simply walks toward the horizon.

> Business owner operating the machinery → business owner operating the business.

He is not a mascot. He never addresses the visitor, never speaks, never gestures
at the interface. He is the silent protagonist, usually in near-silhouette,
small against the architecture — and he is a real person, photographed as part
of the environment art rather than modelled.

## The test every cinematic moment must pass

Each moment must serve one of: **orientation, understanding, proof, desire,
action.** If it serves none, it is removed. There is no motion on this site for
its own sake.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--color-void` | `#050506` | The ground everything sits on |
| `--color-obsidian` | `#08080a` | Panels, cards |
| `--color-graphite-raised` | `#141418` | Raised surfaces |
| `--color-ivory` | `#f2efe9` | Headings, primary text |
| `--color-ivory-dim` | `#c9c5bd` | Body copy |
| `--color-muted` | `#8b8880` | Secondary copy, labels |
| `--color-faint` | `#85827a` | Footnotes. Held at AA on both grounds |
| `--color-champagne-light` | `#f0dcba` | Hot cores of light |
| `--color-champagne` | `#e0c398` | **The accent.** Seams, labels, arrows |
| `--color-champagne-deep` | `#8e7042` | Rules, dim edges |

Champagne is an accent, never a fill. If a composition looks gold rather than
black, there is too much of it.

**Never**: neon, purple AI gradients, cyberpunk, robots, brains, circuit
graphics, generic SaaS illustration, crypto aesthetics, HUD clutter, particle
systems, floating spheres.

## Type

Refined serif against precise modern sans — the identity's core contrast.

- **Display**: Cormorant Garamond, weight 300. Headlines only.
- **Interface**: Inter, weights 300–600. Everything else.
- **Label**: Inter, uppercase, `0.28em` tracking, **never below 12px.** Wide
  tracking buys elegance, not legibility.

One accent word per headline may take the champagne foil gradient (`.foil`).
Two is decoration.

## Motion

Slow, motivated, weighted, elegant.

- Camera: slow dolly, architectural tracking, controlled depth changes.
- Easing: `--ease-cinematic` `cubic-bezier(0.16, 1, 0.3, 1)`.
- Entrances: one shared `.reveal` — 1100ms, opacity and a 1.6rem rise.

**Every major transition is motivated by light already in the scene.** Rooms
hand over with a luminance-led dissolve: the incoming room's bright areas
arrive first, so it reads as walking into its light rather than as a crossfade.
Where two chapters share a room, there is no dissolve at all — the camera
simply keeps moving, which is what makes them feel continuous.

Nothing loops. The camera moves only because the visitor is moving; stop
scrolling and the room settles.

**Never**: bouncy easing, spin transitions, glitches, constant zooming,
scroll-jacking, parallax for its own sake.

## Materials

The materials are photographed, not simulated. Polished black stone, smoked
glass, brushed champagne metal and the long specular reflections that make the
floors read cannot be reached in real time inside this frame budget, and the
supplied renders already have them. The compositor's job is to light and move
that architecture, not to rebuild it.

What the compositor adds on top of a plate:

1. **Grade** — per-scene exposure, contrast, saturation and warmth. Warmth
   rides on the highlights only, so the shadows stay deep rather than brown.
2. **Bloom** — keyed off the plate's own practicals, never applied flat.
3. **Haze** — the far end of a room fills with air, which is what opens depth.
4. **Grain and vignette** — held light. On a photograph, heavy grain reads as
   dirt on the lens rather than as film.

Traps hit during the build, recorded so they are not hit again:

- A cover fit **multiplies** the visible window; dividing samples beyond the
  plate and smears its edge pixels across the frame.
- Framing must be applied inside the cover mapping. A focal point that only
  drives the zoom pivot has no effect on what is actually in shot.

## Copy

Short, precise, confident, restrained. Problems before terminology: a buyer
should not need to know what a webhook is to understand what we sell.

**Never**: "revolutionise", "unlock", "game-changing", "cutting-edge",
"leverage the power of AI", fake urgency, empty luxury language.

**Never fabricate proof.** No invented testimonials, client logos, revenue
figures, conversion results, case studies, rankings, or dashboards presented as
real data. Concepts are labelled `CONCEPT`. Demonstrations are labelled
`SYSTEM DEMO`. Delivered work is labelled `CLIENT WORK` and appears only once it
exists and the client has agreed.

## The Operator

He is **the man in the plates** — a real person in a tailored suit, walking
through real architecture. The procedural capsule rig that stood in for him has
been deleted from the production experience; a mannequin of stacked primitives
was worse than no character at all, and the renders already contain him.

Because he is part of the environment art, he is lit correctly, reflected in
the floor, and correctly scaled against the room in every scene. He never
addresses the visitor and never speaks.

**If a rigged character is ever added** — for a scene that needs him to move
independently of the plate — it belongs in front of the plate as a separate
layer, not as a replacement for it. Requirements for such an asset:

- Licence permitting commercial use and web distribution. No scraped models.
- glTF/GLB, Draco or Meshopt compressed, **under 2.5 MB**.
- Under ~25k triangles. He is rarely more than 200px tall on screen.
- Rigged humanoid skeleton, ideally Mixamo-compatible naming.
- Clips: `idle`, `walk`, `stop`, `look-up`, `turn`, `walk-away`. Root motion
  removed — position comes from the camera path.
- A long coat or overcoat silhouette. It is what makes him read as a person of
  standing rather than a figure in a game.
- Dark, low-saturation materials, roughness 0.6–0.8. He is lit from ahead as a
  rim-lit silhouette; a detailed albedo would be wasted.
- Loaded lazily, on Tier A only, after the corridor is running.

## Assets that would materially improve quality

Only these. Everything else is either done or not worth the weight.

1. **The monogram as vector artwork.** It is currently redrawn by hand from the
   master render; the original paths would be sharper at small sizes.
2. **Higher-resolution plates.** The supplied renders are 1672×941, which is
   slightly soft on a 2× desktop display. 2560px wide would fix it at roughly
   double the bytes.
3. **A portrait render of each room**, framed for phones. The portrait band
   currently crops the landscape plate to its most legible region, which works,
   but a purpose-framed vertical would be better.
4. **A second render of the System Lab with the room unlit**, so the dimmed
   state could cross-dissolve to real darkness rather than to a shadow overlay.
5. **A photographic or rendered OG card**, if a stronger social image is wanted
   than the generated one.

Nothing here blocks launch.
