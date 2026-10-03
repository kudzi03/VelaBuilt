# SEO / AEO / GEO

Discoverability is architectural here. VelaBuilt sells this work, so the site
has to be the first proof that we can do it.

## The principle

Every page answers, in plain HTML, without needing the animation:

1. Who is VelaBuilt?
2. What does VelaBuilt build?
3. Who is each service for?
4. What problem does it solve?
5. What happens during the engagement?
6. What does VelaBuilt not claim?

If a page cannot answer those with the canvas removed, it is not finished.
`scripts/qa.mjs` checks this on every change (no-JavaScript and
reduced-motion runs).

## What is implemented

**Metadata** — every route builds its own through `pageMetadata()` in
`lib/seo.ts`, so canonical URLs, OpenGraph and Twitter cards cannot drift apart
or be forgotten. Titles, descriptions and canonicals are derived from the same
content that renders on the page.

**Structured data** — `lib/schema.ts`. One `@graph` per page, one consistent
`Organization` `@id` across the site so the entity resolves to a single subject
rather than several near-duplicates.

| Type | Where | Note |
| --- | --- | --- |
| `Organization` | Every page | One `@id`, one description, one set of `sameAs` |
| `WebSite` | Every page | Publisher points at the Organization |
| `WebPage` | Home + each service page | `about` the Organization, `isPartOf` the WebSite |
| `Service` | Home + each service page | Description matches the visible summary |
| `BreadcrumbList` | Every page below root | Matches the visible breadcrumbs exactly |
| `FAQPage` | Home + service pages | **Only** for FAQs rendered visibly on that page |
| `CollectionPage` | `/work` | Carries the three category definitions |
| `AboutPage` | `/about` | |

**Deliberately absent**: `AggregateRating`, `Review`, awards, counts, and any
schema describing content a visitor cannot see. Schema that describes navigation
or claims the page does not make is a lie told to a crawler.

**Crawl surface** — `sitemap.ts` generates from the same content the pages are
built from, so a new service page cannot ship without appearing in it.
`robots.ts` allows everything except `/api/`, which is POST-only and has nothing
to index. AI crawlers are explicitly **not** blocked: VelaBuilt's discoverability
offer rests on being readable by answer engines, and blocking them would be
incoherent.

**Answer-first content** — the first sentence of every FAQ answer stands alone
as the answer. `/about` carries a "short version" block written as the questions
an assistant will actually be asked. Service pages state the audience, the
problems, the process and the boundary as separate, labelled sections.

**Internal linking** — every service page links to its related services; the
homepage indexes all four capability areas; `/work` links into the System Lab demonstrations; the footer
carries the full solution set on every page.

**`/llms.txt`** — a machine-readable convenience file only, generated at build
time from `src/content/` (`src/app/llms.txt/route.ts`), so it cannot drift from
the pages. It is not a substitute for semantic HTML and duplicates nothing that
is not already in the markup. It also states, in plain language, what
VelaBuilt does not claim.

**The voice guide** — Vela answers from a knowledge base written from the same
content files and is tested against inventing clients, prices and results
(WORLD.md). It never becomes a source of claims the pages do not make.

## Performance as a ranking input

- Every page except the enquiry endpoint is statically generated.
- The LCP element is server-rendered text. The first screen's entrance is a
  CSS-only focus pull that never touches opacity, so it paints before
  hydration. WebGL loads at idle, after hydration, in several short tasks.
- Fonts are self-hosted by `next/font` at build time — no runtime request to a
  font CDN, no swap-in shift.
- No images are loaded on the critical path on the home page. The object's
  first frame is a server-rendered SVG.
- Layout shift is structurally avoided: the canvas replaces only the still
  *behind* the content, so no text moves. CLS measures 0.

## Entity consistency

The same sentences describe VelaBuilt everywhere — meta description, schema
`description`, `/about`, `/llms.txt` and the footer all pull from
`content/site.ts`. Changing the description in one place changes it everywhere,
which is the point: an entity described three slightly different ways is three
weakly-attested entities rather than one well-attested one.

## Before going live

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production origin. Canonicals, sitemap,
      robots and OG URLs all derive from it.
- [ ] Confirm `sameAs` in `content/site.ts` lists every real VelaBuilt profile.
- [ ] Submit the sitemap in Search Console; confirm the five service pages are
      indexed.
- [ ] Test the OG card in a social debugger.
- [ ] Re-run `node scripts/qa.mjs` against the deployed origin.

## Planned pages

The architecture supports these without change — add content, add a page file:
`/crm-automation`, `/booking-systems`,
`/industries/[vertical]`, and articles once real ones exist (`Article` schema is
deliberately unused until then).
