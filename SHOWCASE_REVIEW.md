# Restaurant showcase review

## Approved release and next iteration

On 2026-10-09 the user approved publishing the existing preview. Commit `5ea1998` was fast-forwarded to the existing production branch, `claude/velabuilt-cinematic-site-69azha`. Vercel reported successful deployment; the public homepage includes the showcase, the demo returns 200, and the retired voice endpoint returns 404. The previous production commit remains `61c7ac5` for rollback.

The next iteration is isolated on `codex/restaurant-walkthrough`. The user clarified that the reference's key quality is physically entering and moving around the restaurant, which the first version's moving still did not deliver. The approved free Higgsfield generation (`18977416-1a14-4762-ac0a-a75140bc6daa`) remained queued at the last check. The user then approved a five-second Runway generation for 25 credits. Task `a303f923-9ab8-46e1-9a1b-2f9ecba5e096` succeeded; its original image-to-video output is included here, locally optimised to 1.87 MB. The prior failed hostname attempt was refunded before retry. Remaining Runway balance after submission: approximately 15 credits.

The implementation adds user-initiated video with pause/replay, offscreen/tab-visibility/booking-dialog pause, no pre-entry video download, a static reduced-motion starting state and a media-error fallback. The existing menu and booking flow are retained. The generated shot has visible perspective changes and a gentle forward move with lateral sway; it does not reproduce the reference's dramatic doorway entry and room turn. Inspected the complete five-second sequence at 4 fps and the rendered mobile end state. `scripts/qa-arrival.mjs` passed at 390px and 1440px for media loading, playback, pause, offscreen pause, booking pause, replay and overflow; reduced-motion defaults and failed-media fallback also passed. TypeScript, build and all eight existing tests passed; lint retains only the existing social-image warning. No new dependency, metadata, analytics or production configuration change is introduced by this iteration.

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

The demo uses original AI-generated photographs, locally served as WebP. Homepage imagery is lazy-loaded; the demo link disables prefetch, while the demo itself prioritises its hero. The first release used an animated still. The walkthrough iteration replaces that effect with locally served generated video requested only after pressing Step inside. Reduced motion removes interface transitions; the video remains a deliberate user action. There is no autoplay audio or scroll hijacking, and this is not a real 3D tour.

Asset source and generation prompts: `public/demo/ember/ASSETS.md`.

## Verification

- TypeScript, all eight existing unit tests and the Next.js production build passed. Lint passed with one pre-existing `no-img-element` warning in `src/app/opengraph-image.tsx`.
- Browser regression passed for 16 routes at 375px and 1440px: HTTP status, overflow, headings, metadata, valid JSON-LD, console/assets, no-JS content, reduced-motion homepage, keyboard focus and enquiry dialog. The mobile restaurant journey passed menu filtering, reservation, all five simulation steps, Escape and focus return. It created no non-analytics POSTs, cookies or browser storage; no ElevenLabs/LiveKit requests occurred and the retired session API returned 404.
- Visually reviewed the hosted homepage showcase, desktop restaurant hero/menu, and mobile hero/form/confirmation/return navigation at 390px. Refined heading contrast, mobile image delivery, return-anchor spacing and final-step focus.
- Compared rendered local production HTML with captured production baseline: title, description, canonical, H1 and social metadata preserved, apart from Next's generated social-image cache hash. The social-image source is unchanged. Organization/WebSite schema is identical; the homepage graph differs only in the obsolete voice-guide FAQ sentence. Robots rules match; the sitemap retains every existing URL and adds only the demo.
- Existing analytics code and Google verification DNS records were inspected. Account-side GA4 receipt, Search Console ownership and production environment values remain unverified. No real enquiry or reservation was submitted.
- The existing Vercel preview protection remains enabled; the preview may require the owner's Vercel sign-in. Automated browser regression used the local production build; authenticated hosted visual checks used the existing browser session. The full six-width matrix was not run.

## Rollback

The approved showcase is live at `5ea1998`; the walkthrough iteration remains a separate preview. Discarding this preview leaves production intact. After an approved walkthrough merge, revert that commit or restore the `5ea1998` deployment. To undo the entire showcase/voice-removal release, restore `61c7ac5`. No data migration is required.
