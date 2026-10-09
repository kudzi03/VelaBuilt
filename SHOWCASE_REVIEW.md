# Restaurant showcase review

## Baseline and scope

- Original local checkout: `88aa6e0432bfa6d05919df79e20630447e2defa3`, clean.
- Production-aligned starting point: `61c7ac59a7dac55e13c4c85a51991cfb22386a3b` on `origin/claude/velabuilt-cinematic-site-69azha`. GitHub reports a successful Vercel deployment for that commit. The local checkout was older and visually different; this change deliberately starts from the current remote source.
- Review branch: `codex/restaurant-showcase`. Hosting remains the existing Vercel `vela-built` project. Production requires approval of the preview.
- Reference: inspected all 11.73 seconds as a 4 fps frame sequence. Interior camera travel, oversized animated lettering, food composition transitions and phone framing informed the concept. No reference frames, branding or watermarks are shipped.

## Preservation

The homepage title, description, canonical, H1, Open Graph/Twitter metadata and existing section headings remain unchanged. The showcase adds an H2. Shared entity/schema helpers, robots rules, redirects, real project/contact destinations and enquiry delivery remain intact. Service/FAQ schema reflects the same necessary removal of public-guide claims as the visible copy.

The new `/demo/ember-and-grain` route uses the existing metadata/schema helpers and sitemap. It is explicitly a fictional concept, with WebPage rather than Restaurant business schema. Simulation states live only inside the page, with no separate indexable routes.

The existing cookie-free analytics implementation remains: client events to `/api/track`, allowlisted server forwarding to GA4 using `GA_MEASUREMENT_ID` and `GA_API_SECRET`, gated by `NEXT_PUBLIC_ANALYTICS`. Only retired voice events/listeners were removed; demo clicks use the existing `data-demo` mechanism. No new property, scripts, tracking IDs, storage or consent behaviour. The real enquiry endpoint is unchanged.

DNS inspection on 2026-10-09 found Google verification TXT records. DNS was not changed. No repository verification tag/file was added or removed. Google Search Console ownership status and GA4 event receipt inside the Google account have not been verified. Production environment values are not copied into this document.

Voice UI, SDK, client tools, session API, prefill-only support and voice CSS are removed. The shared decorative WebGL object remains. Voice-only CSP origins and microphone permission are removed. No account, agent, subscription or credential changes were made.

## Demo and assets

Ember & Grain is fictional. Its menu, prices, Alex Morgan guest record and booking journey are sample data. No reservation, email, message or CRM write occurs. The date, time, party size and occasion remain in React memory only. Real studio contact links retain `/start` and the existing configured email.

The demo uses original AI-generated photographs, locally served as WebP. Homepage imagery is lazy-loaded; the demo link disables prefetch, while the demo itself prioritises its hero. The animation is a finite image entrance and scroll-linked translation of a still image, not generated video or a real 3D tour. Reduced motion removes these effects. There is no autoplay audio or scroll hijacking.

Asset source and generation prompts: `public/demo/ember/ASSETS.md`.

## Rollback

Before production approval, production is unchanged. To discard the preview, leave the production branch untouched. After an approved merge, revert the showcase change commit(s), or promote the previous `61c7ac5` deployment through the existing Vercel project. No data migration is required.
