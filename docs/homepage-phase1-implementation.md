# Homepage simplification and discovery preparation

Historical Phase 1 record. The later [homepage restoration](homepage-restoration.md) supersedes the homepage design and verification instructions below; the pricing, sitemap and discovery improvements remain.

Implemented locally on 2 November 2026. No deployment, migrations, production writes, environment edits, domain or DNS changes. The original architecture audit remains historical evidence, not a description of this new implementation.

## Result

The homepage now has six parts: a short editorial hero, two directly linked Treks/Tours choices, a concise Why StayLocal section, the preserved founder story, the existing inline enquiry form, and a compact footer. Navigation is Home, Treks, Tours, About and Contact. All navigation links remain visible on mobile, without depending on a menu popup.

`/treks` and `/tours` are server-rendered, individually titled/described and self-canonical, with distinct heroes and introductions. Both use current published package data and the shared TripCard. Detail links still use `/trip/[slug]`. `/trips` remains the combined, filterable catalogue. There are no new detail aliases or redirects.

## Removed from the homepage

- The founder experience-card list with the four broken URLs, including its database query. Cards were removed instead of repaired.
- SearchBar's planner trigger and PlannerSheet.
- Discover's category circles, featured carousel, hardcoded curated itinerary carousel and destination carousel.
- TravelByStyle and the repetitive HowItWorks section.
- Hero autoplay video/Ken Burns effects and scroll-triggered reveal wrappers on retained sections.

Unused reusable components remain in the repository, including Discover, carousels, PlannerSheet, TravelByStyle, HowItWorks and Reveal. No package, Experience, customer or booking record was deleted.

## Preserved

The green/cream StayLocal identity, Playfair/DM Sans typography, Tapan Naik's identity and original first-person story, local-knowledge/support/transparent-quote commitments, working-hours/contact details, all policy pages and the inline enquiry flow. No admin/editor, database schema, quote arithmetic, package selector, booking API or authentication implementation was changed. Existing page renderer selection and fallback behavior remain intact.

**Founder photographs:** no founder photograph files or image references exist in the supplied FounderSection, About page or public assets. The existing founder representation was an initial avatar. That identity remains; no stock portrait or invented founder photograph was substituted. Existing assets were not removed. A request for existing photo paths/URLs was sent while implementation continued; incorporating genuine supplied photographs remains a small follow-up.

New local landscape images reuse sources already referenced by the existing website, with optimized Next Image delivery for homepage/hub imagery. Package imagery remains the existing data-driven source; lazy loading and reserved aspect ratio are retained/improved. Source references:

- `public/images/himalayan-peaks.jpg`: `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b`
- `public/images/mountain-trail.jpg`: `https://images.unsplash.com/photo-1454496522488-7a8e488e8606`
- `public/images/island-shore.jpg`: `https://images.unsplash.com/photo-1586500036706-41963de24d8b`

These are landscape illustrations of travel, not claims of founder photography or exact package accommodation.

## Discovery policy without migrations

`lib/discovery.ts` is an explicit, temporary read-only policy. Existing Trek/Treks/Trekking categories count as dedicated treks. Other published products appear under Tours. Himalayan holidays with actual trek/hike content in their highlights or itinerary may additionally appear in a clearly separated related-holidays section on Treks.

The current four published products contain no explicitly categorized dedicated trek. `/treks` therefore explains that dedicated departures are not published yet and offers a planning conversation; Jibhi appears as a mountain holiday with trekking/walks, expressly distinguished from a dedicated departure. Nothing was relabelled in storage and no departure dates, availability or trekking safety facts were invented. New appropriately categorized published products will appear without a code slug allowlist.

## Price and duration investigation

`lib/public-trip-summary.ts` derives display-only summaries from the same offers the current renderer can select, in renderer precedence order. No price is written back and no commercial discount/promo/group rule changes. `lib/public-catalogue.ts` performs one published Trip/packages query and loads enabled universal configuration through the existing validated path; it returns a public card DTO, excluding raw pricing configuration and package payloads.

| Product | Old card | Corrected listing display | Authoritative source |
| --- | --- | --- | --- |
| Jibhi | ₹15,000/person, 9D/8N | ₹7,500/person, 3D/2N | Selectable legacy pricing matrix/duration labels; ₹15,000 is the initial two-person total |
| Darjeeling | ₹5,999/person, no duration | ₹4,999/person, 3D/2N | First selectable legacy matrix column and duration label; unnamed hidden tiers excluded |
| Andaman | ₹18,999 paired with 4N/5D | ₹18,999/person paired with 3N/4D | Regular tier prices and matching duration; excludes promos/comparison/group minima |
| Kashmir | ₹14,999, ambiguous 4-5 | ₹14,999/person, 5 days/4 nights | Published TripPackage adult price/days/nights |

For package-driven products, draft and reserved `universal-` fallback packages are excluded; price-on-request never becomes an advertised numeric offer. Enabled universal products use existing `quoteOffer` with the standard two-traveller basis and existing arithmetic. Package card duration follows its advertised starting offer; detail metadata describes the available duration range. Day parsing reads the D/day marker rather than treating the nights value in `4N · 5D` as days.

Raw public API legacy record fields remain compatible. This phase fixes page display/metadata, not the historical source records or API contract. Missing source itineraries, notably Darjeeling's, are not invented.

## SEO and route verification

`app/sitemap.ts` now forces request-time rendering, includes Treks/Tours and reads every published slug rather than serving a build-time snapshot. Database failures propagate instead of returning a successful static-only truncated sitemap. Package `updatedAt` remains its truthful last-modified date; fabricated current-time timestamps on static pages were removed.

All four published package URLs, including Kashmir, were present in the sitemap served by the local production build. The homepage, both hubs, combined catalogue and all four details returned 200 with one server-rendered H1, metadata description, index/follow and self-canonical. Unknown detail returned 404. Canonicals remain on the existing configured Vercel host; nothing points to the future custom domain. The homepage/hubs have explicit individual Open Graph and Twitter metadata/images.

Desktop 1440px and mobile 390px checks found no horizontal overflow, browser runtime errors, broken images or welcome dialog. Additional 320px checks verify narrow-screen fit. JavaScript-disabled tests verify headings, navigation and package discovery links; navigation to Treks works without hydration. The existing enquiry form was exercised using a browser-intercepted success response; no request was forwarded to the database. This validates the UI handoff, not production persistence or a general enquiry on universal-enabled products.

Evidence: [route/browser verification](../artifacts/homepage-phase1/verification.json), [engineering checks](../artifacts/homepage-phase1/checks.json).

| Page | Desktop | Mobile |
| --- | --- | --- |
| Home | [Screenshot](../artifacts/homepage-phase1/home-desktop.png) | [Screenshot](../artifacts/homepage-phase1/home-mobile.png) |
| Treks | [Screenshot](../artifacts/homepage-phase1/treks-desktop.png) | [Screenshot](../artifacts/homepage-phase1/treks-mobile.png) |
| Tours | [Screenshot](../artifacts/homepage-phase1/tours-desktop.png) | [Screenshot](../artifacts/homepage-phase1/tours-mobile.png) |

## Changed files

| Files | Purpose |
| --- | --- |
| `app/page.tsx` | Simpler composition, published-trip dropdown only; removes Experience query |
| `components/Hero.tsx`, `DiscoveryChoices.tsx`, `WhySection.tsx`, `FounderSection.tsx`, `Editorial.module.css` | Editorial hero/discovery/story/trust layout, local optimized images and responsive styling |
| `components/Navbar.tsx`, `Footer.tsx` | Five-link primary navigation, clear planning CTA, compact footer with policies/contact |
| `components/EnquiryForm.tsx` | Heading/copy refinement only; existing POST contract/behavior preserved |
| `app/treks/page.tsx`, `app/tours/page.tsx`, `components/DiscoveryLanding.tsx` | Server-rendered distinct discovery hubs and honest inventory/related listings |
| `lib/discovery.ts`, `discovery-metadata.ts` | Temporary non-mutating discovery rules and shared page metadata |
| `lib/public-catalogue.ts`, `public-trip-summary.ts`, `trip-duration.ts` | Published-only card data and authoritative offer/duration derivation |
| `components/TripCard.tsx`, `TripsBrowser.tsx`, `app/trips/page.tsx` | Responsive reusable cards, sibling accessible gallery buttons, trek-only difficulty labels, correct duration filtering/prices; keep combined listing |
| `app/trip/[slug]/page.tsx` | Metadata summary correction only; all renderer/page URLs retained |
| `app/sitemap.ts` | Fresh canonical published inventory and both hubs |
| `public/images/*` | Three landscape assets reusing existing website image sources |
| `__tests__/public-trip-summary.test.ts`, `public-catalogue.test.ts`, `discovery-routes.test.tsx` | Price/duration/compatibility, publication, discovery, SSR composition, metadata and sitemap regression tests |
| `scripts/verify-discovery.mjs`, `artifacts/homepage-phase1/*` | Local-only read/browser verification and six screenshots; all browser writes intercepted |
| `package.json` | Replace obsolete `next lint` invocation with supported `eslint .` |
| This report | Implementation decisions, evidence and remaining gaps |

## Engineering results

- `npm test`: **339 passed, 20 files**; includes existing pricing parity, enquiry/admin/security/builder tests.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed production compile, TypeScript, prerendering and route tracing. `/treks`, `/tours` and `/sitemap.xml` are dynamic routes as intended.
- Default `npm run build`: attempted and retried with escalation; blocked by the already documented Turbopack CSS worker port-binding restriction on this machine. This is not a successful default-builder check; CI must verify it before release. The supported webpack builder passed.
- `npm run lint`: now invokes the valid ESLint CLI, but reports **22 existing errors / 32 warnings**, all errors in unchanged files: BookingModal, Reveal, TripForm, UniversalTrip, legacy-universal, universal-backfill and staging-tests/admin. No rules were disabled to hide these errors and no unrelated admin/pricing refactor was made to satisfy lint. Exact rules/locations are in `checks.json`.
- ESLint across all 25 new/changed JS/TS source/test/script files: **zero errors**, one existing raw-image warning in TripCard. Arbitrary admin-supplied image URLs were not put behind a broad wildcard optimizer policy.
- `git diff --check`: passed.

Reproduce screenshots after the webpack build:

```sh
npm run start -- --hostname 127.0.0.1 --port 3114
node scripts/verify-discovery.mjs http://127.0.0.1:3114
```

The review script refuses non-localhost targets. It reads the currently configured published catalogue and never forwards browser API writes. Keep any future persistence/admin end-to-end tests on a separately verified isolated database. No CrUX/field CWV improvement or Google indexing result is claimed from these local checks.

## Remaining gaps before dedicated section detail URLs

1. Introduce and review an explicit trek/tour discriminator through an approved additive migration, validation and Builder workflow. The current read-only category/content discovery policy is temporary and does not establish product classification.
2. Publish genuine dedicated trek products with reviewed difficulty, altitude, distance, basecamp, pickup/drop, fitness, equipment and safety information. Add real departures only when operational data exists. Complete incomplete source itineraries.
3. Decide a per-record canonical URL map; then implement `/treks/[slug]` and `/tours/[slug]` with preserved renderer/pricing behavior, wrong-kind/draft 404s, and reviewed redirects from `/trip/[slug]`. Update all links/metadata/sitemap together. No redirects were introduced now.
4. Resolve the existing generic homepage enquiry contract for universal-enabled Trips without weakening selected-offer validation; consider a genuine general customization enquiry type. Existing WhatsApp customization remains usable in this phase.
5. Supply genuine founder photo assets and review exact product/brand imagery and content. No substitute portrait was created.
6. Resolve baseline lint errors and validate the default Turbopack builder in CI. Repeat authenticated admin and persistence checks on isolated staging before any release.
7. Implement the separately scoped structured-data, analytics/GSC and canonical-domain migration work once owner information/access is supplied. No credentials or domain readiness were assumed.
