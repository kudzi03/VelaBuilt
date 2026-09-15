# Fonts

Self-hosted, loaded by `next/font/local` in `src/app/layout.tsx`. Both families
are licensed under the SIL Open Font License 1.1 (`OFL-*.txt`, kept alongside
the files as the licence requires). Neither declares a Reserved Font Name, so
subset files may keep the family names.

| File | Source | What was changed |
| --- | --- | --- |
| `inter-latin.woff2` | Inter (variable), Google Fonts latin subset | Re-subset to the same latin character set. Variable weight axis kept whole. |
| `cormorant-garamond-300-latin.woff2` | Cormorant Garamond (variable), latin subset | Weight axis pinned to 300. |
| `cormorant-garamond-300-italic-latin.woff2` | Cormorant Garamond Italic (variable), latin subset | Weight axis pinned to 300. |

The sources are the exact files `next/font/google` served before, so glyphs
are unchanged: site copy rendered at every size and weight the design uses
was pixel-diffed, original against these files, with zero differing pixels.

Pinning Inter's weight axis to a 300–600 range was tried and rejected — it
re-quantised outlines at 300, 500 and 600 by up to a pixel's worth of
anti-aliasing. Cormorant is only ever rendered at 300, so pinning it is exact.

Produced with [`subset-font`](https://www.npmjs.com/package/subset-font) 2.7.0
(HarfBuzz `hb-subset`), keeping Google Fonts' latin `unicode-range`:
U+0020–007E, U+00A0–00FF, U+0131, U+0152–0153, U+02BB–02BC, U+02C6, U+02DA,
U+02DC, U+0304, U+0308, U+0329, U+2000–206F, U+20AC, U+2122, U+2191, U+2193,
U+2212, U+2215, U+FEFF, U+FFFD. HarfBuzz's default layout features are kept
(kerning, ligatures, contextual alternates); the site sets no opt-in
features.

If the design starts using another Cormorant weight, add a file pinned to that
weight rather than falling back to a synthesised one.
