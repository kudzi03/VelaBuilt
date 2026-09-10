# VelaBuilt

Systems for what's next.

The VelaBuilt website: a cinematic brand experience, a sales system, an
interactive product demonstration and a piece of technical proof — in one
build.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run check        # typecheck + lint + build
npm run build && npm start
```

## Verify it

```bash
bash scripts/serve.sh          # production server on :3000
node scripts/qa.mjs            # every route, desktop + phone
node scripts/fallbacks.mjs     # reduced motion, no WebGL, no JavaScript
node scripts/interaction.mjs   # keyboard walk + the whole enquiry flow
node scripts/peek.mjs 0 0.5 1  # capture the 3D world at points in the journey
```

## The documents

| | |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it is built and where things live |
| [CREATIVE_SYSTEM.md](CREATIVE_SYSTEM.md) | The visual and motion language, and the character asset spec |
| [SEO_AEO_GEO.md](SEO_AEO_GEO.md) | Discoverability for people, search engines and AI systems |
| [SECURITY.md](SECURITY.md) | Secrets, the enquiry endpoint, headers, and known limits |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | What is done, what is verified, what is next |

## One rule

**WebGL decorates the website. WebGL is not the website.**

Every word, link and control exists in semantic HTML. Remove the canvas and the
site is intact. That is checked automatically, on every change, by
`scripts/fallbacks.mjs`.

## Configuration

Copy `.env.example` to `.env.local`. The site runs correctly with nothing set.
