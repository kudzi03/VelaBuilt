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
small against the architecture.

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
| `--color-faint` | `#5f5d58` | Footnotes |
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

**Every major transition is motivated by something physically in the scene.**
Chapter changes happen because the camera passes through a threshold — a real
doorway in the corridor — not because a transition was applied over the top.

The Operator's walk cycle is driven by actual scroll velocity: stop scrolling
and he stops walking. Nothing loops in place.

**Never**: bouncy easing, spin transitions, glitches, constant zooming,
scroll-jacking, parallax for its own sake.

## Materials

Four materials carry the whole world, all hand-written (`world/materials.ts`):

1. **Lit black stone** — floor, with the corridor's light smeared into it.
2. **Champagne seams** — thin illuminated architectural lines.
3. **Additive bloom** — authored where a real source would flare.
4. **Black glass** — interface panels with generated content.

Two traps, both hit during the build and documented so they are not hit again:

- `new THREE.Color(hex)` **already** converts sRGB → linear under colour
  management. Converting again drags everything toward black.
- A radial glow falloff on a long strip lights its middle and abandons both
  ends. Long seams use the `cross` falloff.

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

## Character asset specification

The Operator is currently a **procedural rig built from primitives** — capsules
and a cylinder coat, no purchased or scraped assets, no licence encumbrance. It
reads correctly because he is small, dark and nearly always in silhouette.

It is isolated behind one component (`world/Operator.tsx`) and one contract.
Replacing it does not touch the world, the camera, the stations or the page.

**To swap in a production character**, replace the `<group>` contents with a
loaded skinned mesh and drive its `AnimationMixer` from the three values the
component already computes:

| Value | Range | Meaning |
| --- | --- | --- |
| `phase` | 0→2π | Walk cycle position, advanced by distance travelled |
| `speed` | 0→1 | How fast the journey is moving; 0 means standing |
| `attention` | 0→1 | How much he is looking up at the architecture |

**Requirements for the final asset:**

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

1. **The rigged Operator** above. The single biggest upgrade.
2. **The VelaBuilt identity board and master monogram artwork.** The monogram is
   currently redrawn as vector paths from the reference; the authoritative
   artwork should replace `Monogram.tsx` and `icon.svg`.
3. **Two or three environment textures** — brushed metal, dark stone, a subtle
   floor normal map. KTX2/Basis, under 512 KB each. The corridor is currently
   entirely procedural, which is clean but slightly too clean.
4. **Reel 01 keyframes**, to confirm the corridor's proportions match the
   Instagram world rather than merely resembling it.
5. **A photographic or rendered OG card**, if a stronger social image is wanted
   than the generated one.

Nothing here blocks launch.
