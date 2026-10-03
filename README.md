# VelaBuilt

The systems a business runs on.

The VelaBuilt website: one engineered structure behind every page that
rebuilds itself for each part of the business, and Vela, the voice guide
that lives in it and can move the site while it talks.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run check        # typecheck + unit tests + lint + build
npm run build && npm start
```

## Verify it

```bash
bash scripts/serve.sh            # production server on :3000
node scripts/qa.mjs              # every route × six widths, WebGL, no-JS, reduced motion, keyboard, dialogs
node scripts/contrast.mjs        # WCAG contrast on every rendered text run
node scripts/voice-tools.mjs     # Vela's tool calls against a mocked ElevenLabs socket
```

Set `CHROME_PATH` to point the scripts at a specific Chromium.

## The documents

| | |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How it is built and where things live |
| [WORLD.md](WORLD.md) | Vela: the object, the agent, the tools, and how it was verified |
| [CREATIVE_SYSTEM.md](CREATIVE_SYSTEM.md) | The visual, motion and copy language |
| [SEO_AEO_GEO.md](SEO_AEO_GEO.md) | Discoverability for people, search engines and AI systems |
| [SECURITY.md](SECURITY.md) | Secrets, the enquiry endpoint, the voice guide, headers |
| [DOMAIN-SETUP.md](DOMAIN-SETUP.md) | Putting the site on velabuilt.com |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | What is done, what is verified, what is not |

## One rule

**The object decorates the website. It is not the website.**

Every word, link and control exists in semantic HTML. Remove the canvas, turn
off JavaScript or reduce motion, and the site is intact. `scripts/qa.mjs`
checks it.

## Configuration

Copy `.env.example` to `.env.local`. The site runs with nothing set; each
credential turns on one integration.
