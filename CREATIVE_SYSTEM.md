# Creative System

The rules that keep VelaBuilt.com, and anything made after it, looking like one
place.

## The idea

A warm, bright studio space with one dark object in it. The object is
VelaBuilt: an engineered structure of graphite members around an amber core.
It never leaves. As the visitor moves through the site it rebuilds itself
into what each part of the business is about: interface planes for digital
experiences, an aperture for AI, a circuit for automation, a lattice for
business systems, a frame for the work.

When the visitor talks to it, it is Vela. It contracts to listen, flows
inward while thinking, brightens and pushes outward while speaking, and
moves the site when it acts.

> One structure, one space, one voice. A page is not a new scene; it is the
> same structure standing somewhere else.

## The test every moving thing must pass

Each moment must serve one of: **orientation, understanding, proof, desire,
action.** If it serves none, it is removed.

## Palette

Light ground, dark object, one warm accent. Token names are inherited from
the earlier dark theme, which is why `ivory` is now the text colour.

| Token | Value | Use |
| --- | --- | --- |
| `--color-void` | `#f4f1ec` | The page ground |
| `--color-paper` | `#f7f5f1` | Sheets: solid reading grounds that travel over the object |
| `--color-graphite-raised` | `#faf8f5` | Cards, raised surfaces |
| `--color-ivory` | `#151412` | Headings, primary text |
| `--color-ivory-dim` | `#34322e` | Body copy |
| `--color-muted` | `#5a564f` | Secondary copy, labels |
| `--color-champagne` | `#7a4f15` | The accent on text: bronze, AA on every ground |
| `--color-amber` | `#e3892a` | The object's core, lit markers, the voice dot. Never text |

Amber is light, never fill. If a composition looks orange rather than
graphite-on-paper, there is too much of it.

**Never**: neon, purple AI gradients, cyberpunk, robots, brains, glowing
circuit-board clip art, generic SaaS illustration, crypto aesthetics.

## Type

- **Archivo**, variable, weights 300–600, width 100–125%. Display and body.
  Display sizes run slightly expanded and tight; body stays at normal width.
- **Geist Mono**, weights 400–500. Labels, counters, the instrument text.
  Uppercase, tracked, never below 12px.

## Motion

Slow, motivated, weighted.

- Easing: `--ease-cinematic` `cubic-bezier(0.16, 1, 0.3, 1)`.
- Entrances: one shared `.reveal` (opacity, a short rise, a light blur).
- The object morphs with a building wave: members dissolve, nodes travel on
  staggered paths, new members form behind them. Energy pulses hop along
  edges between nodes.
- Nothing is on a timer except the object's own slow drift. Stop scrolling
  and the page settles.

Under `prefers-reduced-motion`, reveals are instant and the object draws a
frame only when its state changes.

**Never**: bouncy easing, spin transitions, glitches, scroll-jacking,
parallax for its own sake.

## Copy

Short, precise, confident, restrained. Problems before terminology. A buyer
should not need to know what a webhook is to understand what we build.

**Never**: "revolutionise", "unlock", "game-changing", "cutting-edge",
"leverage the power of AI", fake urgency, empty luxury language.

**Never fabricate proof.** No invented testimonials, client logos, revenue
figures, results, case studies, rankings, prices, timelines, or dashboards
presented as real data. Delivered work is labelled `CLIENT WORK` and appears
only once it exists. Demonstrations are labelled `SYSTEM DEMO`. Vela is held
to the same rule: see WORLD.md.

## Assets that would materially improve quality

1. **The monogram as vector artwork**, rather than redrawn by hand.
2. **More published work.** Cardio Life is the only case study. Each new one
   becomes a `show_project` value and a `frame` chapter.
3. **A rendered OG card of the object**, if a stronger social image is wanted
   than the generated one.
