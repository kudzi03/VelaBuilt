# Fonts

Self-hosted, loaded by `next/font/local` in `src/app/layout.tsx`. Both families
are licensed under the SIL Open Font License 1.1 (`OFL-*.txt`, kept alongside
the files as the licence requires). Neither declares a Reserved Font Name, so
subset files may keep the family names.

| File | Source | What was changed |
| --- | --- | --- |
| `archivo-var.woff2` | Archivo (variable, `wght` + `wdth`), Fontsource 5.3.0 latin file | `wght` axis limited to 300–600 and `wdth` to 100–125, the ranges the design uses. Latin subset kept. |
| `geistmono-var.woff2` | Geist Mono (variable, `wght`), Fontsource 5.3.0 latin file | `wght` axis limited to 400–500. Latin subset kept. |

Produced with fontTools (`varLib.instancer.instantiateVariableFont` to limit
the axes, then `subset` with the source file's own latin `unicode-range`),
saved as WOFF2 with Brotli. HarfBuzz default layout features are kept
(kerning, ligatures, contextual alternates).

Archivo carries the display and body type; its width axis is what gives the
headings their slightly expanded set. Geist Mono carries labels, counters and
the instrument text.

If the design starts using a weight or width outside these ranges, re-instance
from the source file rather than letting the browser synthesise it.
