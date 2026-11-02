# StayLocal V2 — trips, SEO and architecture audit

Audit date: 2 November 2026. Phase 1: audit only.

## Scope, evidence and limits

Reviewed the App Router route tree, Prisma schema and upgrade SQL, public components, all trip renderer paths, Trip Builder, validation/publication/write boundaries, authentication, enquiry processing, pricing helpers, seed policy, existing documentation and test coverage. Reviewed the installed Next.js 16.4.2 documentation for metadata, Server/Client Components, sitemap caching and images. React is 19.2.4; persistence is PostgreSQL through Prisma 5.22.0 (`package.json`, `prisma/schema.prisma`). The checked-in `prisma/staylocal.db` is not the configured PostgreSQL datasource and was not treated as production evidence. Seed content and old review documents are not evidence of current publication state.

Read-only live checks used public HTTP GET requests and Chromium at 390 × 900 and 1440 × 900. Examined homepage, listings, every currently published detail page, four experience links, proposed hubs, a nonexistent detail URL and the admin login. Inspected screenshots of homepage, listing and Jibhi. Public API, HTML, screenshots and browser observations were held in `/tmp/staylocal-audit-*` and `/tmp/staylocal-seo-audit-results.json`; these temporary artifacts are not durable project deliverables. Browser page loading may invoke the application's non-persisting quote endpoint; no enquiry, admin write, login, upload or booking action was submitted.

No production database connection, credentials, DNS/domain changes, environment edits, code changes or deployments were performed. This document is the only repository addition. No build, seed, migration or production-mutating test suite was run. Google Search Console (GSC), analytics accounts, Vercel project settings, deployed commit identity, CrUX field data and authenticated admin UI were not available/inspected. Therefore indexing, traffic, conversion rates, actual CWV pass/fail, production feature flags and credential configuration cannot be asserted. Admin findings are source-based unless explicitly marked live.

## Main conclusions

1. Preserve the functioning travel marketplace foundation: published-only public access, four renderer paths, package selection, INR estimates, WhatsApp, booking enquiries and guarded content editing.
2. Fix current discovery and content accuracy before expanding landing pages. The live sitemap omits Kashmir; four homepage experience links return 404; listing prices/durations disagree with detail content.
3. Categories already exist. Add one independent, nullable `Trip.productKind` discriminator for `trek`/`tour`, retaining theme `category` and renderer `type`. Do not duplicate Trips or repurpose either existing field.
4. Reuse package/pricing infrastructure for both sections. Add validated trek facts separately; dated departures require an additional model only when actual batch management is introduced.
5. Introduce canonical section routes with an explicit old-to-new mapping and verified custom-domain cutover. Neither new hub exists today. Do not point canonical URLs at the future host until it is live and approved.

## Current architecture and actual routes

### Rendering and content flow

`app/page.tsx` and `app/trips/page.tsx` are asynchronous Server Components, query published Trips and force dynamic rendering. Homepage also queries published Experiences. Listing cards receive normalized public prices through `lib/public-trip-prices.ts`. `TripsBrowser` receives the entire published catalogue, filters in client state initialized from `searchParams`, and updates the URL with `router.replace`. It does not implement database pagination. A Client Component is not automatically client-only: Next.js prerenders its initial HTML. Live HTML contains trip headings and links, and sampled detail HTML contains itinerary titles.

`app/trip/[slug]/page.tsx` checks publication and uses this precedence:

1. `loadUniversal()` → `UniversalTrip` when the global opt-in and per-trip configuration allow it, except protected Andaman.
2. `type === 'andaman'` → `AndamanPage`.
3. `type === 'calculator'` → `CalculatorTrip`; otherwise `EnquiryTrip`.

Calculator and enquiry renderers each choose a published `TripPackage` view when packages exist, otherwise legacy JSON fields. `legacyPackages()` excludes `universal-` slugs. Do not bypass this adapter when introducing new URLs. `TripExperience` is universal configuration, while `Experience` is separate founder/travel content; their similar names do not imply interchangeable data.

### Page inventory

| Actual URL | Source | Purpose/status |
| --- | --- | --- |
| `/` | `app/page.tsx` | Homepage; live 200 |
| `/trips` | `app/trips/page.tsx` | Unified published catalogue; live 200 |
| `/trip/[slug]` | `app/trip/[slug]/page.tsx` | Current canonical package destination; published-only, missing/draft → `notFound()` |
| `/about`, `/contact` | Corresponding `app/*/page.tsx` | Brand/support pages |
| `/privacy`, `/terms`, `/cancellation` | Corresponding `app/*/page.tsx` | Existing policies |
| `/robots.txt`, `/sitemap.xml`, `/favicon.ico` | `app/robots.ts`, `app/sitemap.ts`, `app/favicon.ico` | Metadata routes/assets |
| `/admin/login` | `app/admin/login/page.tsx` | Live 200; credentials UI |
| `/admin` | `app/admin/page.tsx` | Protected dashboard |
| `/admin/trips` | `app/admin/trips/page.tsx` | Trip management |
| `/admin/trips/new`, `/admin/trips/[id]/edit` | Corresponding pages | Shared Trip Builder |
| `/admin/experiences`, `/admin/bookings`, `/admin/users` | Corresponding pages | Experience content, enquiry pipeline, users |

`/treks` and `/tours` returned real HTTP 404 with noindex. There are no corresponding section detail routes, destination landing routes, blog routes, public experience detail routes, checkout or payment routes in this repository.

### API inventory

| Route | Methods and existing responsibility |
| --- | --- |
| `/api/trips` | GET published Trips and public starting prices |
| `/api/trips/[slug]` | GET published detail/packages; sanitized universal config where enabled |
| `/api/trips/[slug]/quote` | POST non-persisting validated universal quote; `no-store` response |
| `/api/bookings` | POST validated enquiry; GET admin-only enquiry list |
| `/api/auth/[...nextauth]` | NextAuth GET/POST authentication handlers |
| `/api/admin/trips` | POST new trip/packages/config transaction |
| `/api/admin/trips/[id]` | PUT guarded edit; DELETE admin-only |
| `/api/admin/trips/[id]/universal` | GET configuration/capability; special `new` ID supported |
| `/api/admin/trips/check-slug` | GET slug availability |
| `/api/admin/media` | GET authenticated storage capability; POST authenticated image upload |
| `/api/admin/experiences` | POST experience creation |
| `/api/admin/bookings/[id]` | PATCH enquiry status |
| `/api/preview-readiness` | GET preview isolation readiness; 404 outside preview |

`proxy.ts` redirects unauthenticated admin page requests based on cookie presence. Actual authorization is additionally enforced by `lib/requireAdmin.ts`, `lib/admin-access.ts` and NextAuth session checks; cookie presence alone is not the authorization boundary.

### Live published catalogue

Public `/api/trips` returned exactly these four records during this audit:

| Current detail URL | Category / renderer | Card price / duration | Detail observation |
| --- | --- | --- | --- |
| `/trip/jibhi` | Mountains / calculator | ₹15,000 per person; `9D · 8N` | Initial 3D/2N offer ₹7,500/person, ₹15,000 for two; selectable 3/4/5-day trips |
| `/trip/darjeeling` | Mountains / calculator | ₹5,999 per person; empty duration | Initial 3D/2N ₹4,999/person, ₹9,998 for two; public detail API has no packages, `itinerary: '[]'` |
| `/trip/andaman` | Islands / andaman | ₹18,999; `4N · 5D` | ₹18,999 is the 3N/4D option; initial selected 4N/5D starts at ₹22,999 |
| `/trip/kashmir-valleys-lakes-mountain-escapes` | Mountains / calculator | ₹14,999; `4-5` | Published 5D/4N package; ₹29,998 for two; absent from live sitemap |

This is a publication snapshot, not a claim that the database contains only four Trips. All four pages returned 200, self-canonical URLs, index/follow and one H1 at 390px. No broken images or document horizontal overflow were detected on sampled pages. All four themes are Mountains/Islands; none has an explicit Trek category. Mountain holidays with optional walks must not be automatically classified as dedicated treks.

## Existing features to preserve

- **Content control:** draft/published gates on Trip and TripPackage, unknown/draft detail 404, lowercase global unique Trip slug, per-trip package slug uniqueness, ordered packages.
- **Builder:** `components/admin/TripForm.tsx`, `lib/trip-builder.ts`, `components/admin/PackagesEditor.tsx` and `builder/*` provide Basics → Photos → Packages & Itinerary → Trip Details → Review & Publish; cover/gallery, itinerary editing, package ordering, FAQs, inclusions/exclusions, desktop/mobile preview and publishing confirmation.
- **Safe writes:** strict Zod inputs plus explicit whitelists (`lib/trip-schemas.ts`, `lib/content-validation.ts`), transaction boundaries, edit timestamps, owned package IDs and explicit removal confirmation. Existing slugs and rendering modes are locked in the edit API. Add new field support through every validation layer.
- **Compatibility:** legacy JSON preserved when untouched; Andaman pricing/itinerary changes are protected; universal activation is admin-only, flag-gated, independently versioned and requires migration parity confirmation. `lib/universal-write.ts` also validates active universal content when older clients save packages.
- **Pricing:** INR formatting, per-person/group totals, price-on-request, universal offers/tiers/durations/stays, approved comparison-price evidence and promo rules. Preserve rounding and server authority (`lib/pricing.ts`, `lib/universal-trip.ts`).
- **Enquiries:** `BookingModal` and homepage `EnquiryForm` POST to `/api/bookings`. Server validates publication/package ownership, recomputes supported package/universal estimates, suppresses recent phone+trip duplicates, persists Booking and returns success. WhatsApp fallback and explicit “not booked yet / final quote confirmed” messaging already exist. No payment processing is implied.
- **Security/operations:** admin/editor roles, session credential rotation and login throttling, same-origin browser admin write checks; preview database identity isolation (`lib/preview-isolation.ts`), local-only seed policy. Preserve existing policy pages and support links.
- **Media:** authenticated upload exists, contrary to the historical first paragraph of `docs/trip-builder-storage.md`. `lib/image-upload.ts` validates 4 MiB inputs, image bytes, pixel limits, rejects animated/SVG content, strips metadata and outputs resized WebP via Sharp. Blob configuration is optional; URL entry remains usable. Actual production storage credentials were not inspected.

## Ranked issues

### Critical

**No confirmed current site-wide critical outage or indexing block.** Current canonical package pages respond successfully. The following are critical release gates for future work, not claims of incidents:

- Do not repurpose `Trip.type`, rewrite protected slugs, replace legacy pricing or blanket-migrate all mountain holidays to treks. These changes can alter renderer/pricing/enquiry behavior or lose URLs. Keep identities and booking references stable.
- Do not run migrations, seeds or staging write tests against an unverified datasource. Preserve preview isolation and require reviewed additive SQL, backup and parity checks before any later production migration.
- Do not launch the custom host with two indexable copies, missing HTTPS, wrong canonicals or redirect loops. Domain activation is a separate authorized release step.

### High

| Finding and evidence | Impact | Smallest corrective direction |
| --- | --- | --- |
| Live sitemap has three package URLs, omitting published Kashmir. Static timestamps are 21 Oct while live catalogue includes newer content. `app/sitemap.ts` has no dynamic/revalidation policy; Next's installed docs state sitemap handlers cache by default. It also catches DB failures and returns static-only output. | New packages may not be discovered through the sitemap; failures can silently replace a useful map. | Set deliberate freshness/invalidation, compare published count/URLs, monitor query failures and avoid successfully caching incomplete output. Staleness is observed; exact deployed cache cause is not independently proven. |
| `FounderSection.tsx` links `Experience.slug` directly to `/trip/...`; `/trip/billing`, `/trip/rishikesh`, `/trip/simlipal`, `/trip/jibhi-waterfalls` are linked from homepage and returned 404. No FK ensures matching Trip. | Broken navigation and crawl paths. | Only link verified published related Trips; keep unmatched items as editorial cards until real detail content exists. Do not redirect unrelated experiences to a generic hub. |
| Listing/card and detail prices/durations disagree, as captured above. `publicTripPrices()` corrects universal configurations only; otherwise it returns legacy `Trip.price`. Metadata uses free-text `Trip.duration`. | Misleading commercial snippets, poor filter results and lost trust. | One read-only public summary adapter covering published packages, universal offers, legacy matrices and Andaman; distinguish starting offer from selected offer and group total from per-person. Review stored content rather than guessing a data correction. |
| Darjeeling has no day-by-day itinerary (`itinerary: '[]'`, no published packages); Jibhi's `9D · 8N` summary differs from its 3–5-day selection. Legacy exemptions in `lib/trip-publish.ts` permit existing matrix trips without complete package content. | Thin/inconsistent detail pages and search intent mismatch. | Complete approved content and validate new publication summaries while retaining legacy compatibility. |
| Trek facts and actual departure batches are absent as structured data. Difficulty defaults to Easy, including tours. | No dependable altitude/distance/fitness filters or operational departure selection. | Add validated trek facts and explicit classification; introduce actual batches only with reviewed dates/capacity semantics. Never present defaults as expert safety assessment. |
| Homepage generic enquiry has only `tripSlug`, while enabled universal trips require package ID plus `universalSelection` in `/api/bookings`. | A generic homepage enquiry to a future universal-enabled Trip would fail validation. | Distinguish trip-level quote requests from package-selection enquiries, preserving strict offer validation on selected quotes. Source-confirmed compatibility risk, not claimed as live failure today. |

### Medium

| Finding and evidence | Recommendation |
| --- | --- |
| `/trips` live title is `All trips — StayLocal · StayLocal`. Darjeeling title is `Darjeeling Escape — in Darjeeling, West Bengal · StayLocal`. Subtitle is used verbatim for detail descriptions; Kashmir's is a long paragraph. | Avoid duplicate branding, omit missing duration gracefully, offer bounded editorial SEO overrides with useful generated fallbacks. Character counts are editorial guidance, not ranking thresholds. |
| No JSON-LD in inspected live pages or repository public rendering code; no breadcrumb trail. | Add truthful Organization/TravelAgency, WebSite, BreadcrumbList, listing ItemList and suitable trip semantic markup. Do not invent ratings, stock or dates. |
| Homepage has no default OG image; `layout.tsx` supplies root Twitter title/description inherited by pages without overrides, including `/trips` and policy pages. Root canonical `/` is inherited by admin login and 404s. | Add shared OG fallback and explicit per-page social metadata; scope root canonical to home; suppress irrelevant canonical on errors/private pages. Existing public static pages do already set their own canonicals. |
| `/admin/login` live has index/follow and home canonical. Robots disallows `/admin`, but this is not an indexing guarantee. No source noindex for admin or explicit preview policy. | Server admin metadata/noindex, appropriate headers and deployment-level preview protection. For already indexed URLs Google needs access to see noindex; plan removal without exposing protected content. Auth and robots are separate controls. Vercel's actual preview headers were not audited. |
| Raw `<img>` throughout Hero, TripCard, galleries and trip renderers; no `next/image` usage/configured remote image policy. Cards reserve aspect ratio and many galleries reserve dimensions, mitigating some CLS. | Responsive sources and sizes, suitable width/height, eager/high-priority LCP only, lazy lower-page media. Reuse uploaded WebP; allowlist known hosts before using Next image optimization. |
| Homepage force-dynamic queries and `publicTripPrices()` can add a Trip+packages query and configuration lookup per Trip when enabled; metadata and detail also repeat work. | Batch loading and request memoization; deliberate publication-aware caching, never sharing booking/admin/quote responses. Measure TTFB/query counts first. |
| Filters/search use URL params but canonical always points to `/trips`; no separate internal-search noindex policy. `router.replace` runs on every filter change without an actual debounce. | Define query policy and debounce keyword routing; precompute cheap summaries and paginate only when catalogue warrants it. |
| `durationDays()` parses first number, so `4N · 5D` can become four days. Regional links search labels such as `Kashmir & Ladakh`, but the text haystack may not contain the label. | Use numeric package duration and stable normalized destination IDs, preserving current links/query compatibility. |
| Homepage “Search…” opens a planner, not text search. Planner collects traveller/month preferences but submit only forwards destination/duration/budget. | Make discovery intent clear; apply or remove unused preference fields, retaining preferences for customization enquiries if collected. |
| `CuratedTrips.tsx` contains eight hardcoded itineraries/prices shown through modal buttons and WhatsApp; not database-controlled package links. Jibhi/Darjeeling/Andaman overlap actual catalogue concepts. | Retain inspiration functionality but clearly separate indicative ideas; map verified equivalents to canonical packages and approved pricing. Do not manufacture eight indexable pages. |
| CSS `.reveal` starts at opacity zero until IntersectionObserver runs. Full-page screenshot showed blank below-fold reveal blocks until scrolled; HTML content still exists. | Make content visible by default; enhance animation after readiness. Treat this as a visual resilience problem, not proof Google cannot index the HTML. |
| Mobile `/trips` cards max out at 288px in a wider content column. Dense detail text, long calculator before itinerary, horizontal selectors and small secondary labels affect scanning. | Full-width listing cards, readable facts, shorter decision block, jump links and tested sticky CTA clearance. No overflow found in sampled widths. |
| Modal/menu keyboard support varies: Planner has Escape/initial focus/restoration but no complete focus trap; BookingModal locks scroll but lacks comparable Escape/focus handling; filters/menu likewise need keyboard review. TripCard nests gallery buttons inside a link. | Shared accessible dialog/menu behavior, visible focus, focus trap/restoration, semantic sibling card controls and approximately 44px touch targets. |
| `CalculatorTrip` shows fixed inclusion chips; `EnquiryTrip` has fixed trust claims; Andaman advertises 24/7 support while brand config gives Mon–Sat 9–8 IST. | Derive commitments from approved package facts and reconcile support promises. Add verified reviews/team/partner credentials only when supplied. |
| No GA/GTM/Vercel Analytics, Search Console verification or web-vitals reporting integration found in application source/dependencies or inspected HTML. | Owner-provided property IDs/access and a documented event plan; absence in source does not establish absence of account-side configuration. |

## Proposed information architecture and URL policy

| Proposed URL | Purpose and indexing |
| --- | --- |
| `/` | Brand/discovery hub; links directly to both primary sections |
| `/treks` | Dedicated Himalayan/Indian trek landing/listing; unique intro, real offerings, trek filters |
| `/treks/[slug]` | Single canonical dedicated-trek detail |
| `/tours` | Domestic holiday/tour listing; independent intent/copy and filters |
| `/tours/[slug]` | Single canonical holiday/tour detail |
| `/trips` | Preserve combined discovery hub with links to both sections; distinct copy and mixed catalogue |
| `/trip/[slug]` | Keep as existing canonical until classification/transition is approved; thereafter permanent redirect for mapped records |
| `/about`, `/contact`, policy routes | Preserve URLs/content and navigation |

Do not put package variants at separate indexable URLs initially. Keep selection state within one detail; optional shareable package query params canonicalize to that detail. One Trip has one product kind and one canonical route. At the wrong section URL, return 404 rather than rendering a second indexable copy. API paths and `Booking.tripSlug` stay unchanged. Add editorial region/season/collection pages later only with sufficient approved inventory and original useful content; avoid a thin combinatorial destination/difficulty/month directory. Use a non-conflicting route namespace if such pages are introduced.

Primary navigation: **Treks, Tours, All Trips, About, Contact**, with **Customize My Trip** and WhatsApp actions. Destinations can remain a homepage anchor initially; it is not currently a standalone page. Group departures can be a real filtered discovery view once dates exist, rather than an unsupported promise or empty SEO landing page.

### Redirect inventory and duplicate-content control

- Record every currently published slug and its reviewed classification, plus GSC/backlink URLs when access is supplied. Preserve slug strings. The four live holiday products are plausible tour candidates, but classification requires itinerary/product review; a guided walk inside a holiday does not establish trek intent.
- Example **after classification approval**: `/trip/andaman` → `/tours/andaman`; same pattern for Jibhi, Darjeeling and Kashmir only once approved. Use server permanent 301/308 and test final 200/self-canonical. Do not introduce redirects during this audit.
- Keep unclassified Trips reachable under `/trip/[slug]`; no blanket redirect that strands them. Classification changes after migration must update the old-to-new mapping and links, preventing chains.
- Four broken experience URLs require either genuine matching content, verified relevant relationships or link removal. They do not justify redirecting everything to `/tours` or home.
- Keep `/trips` indexable as a distinct combined hub. For sort/tracking-only variants use the clean hub canonical. For internal keyword search and arbitrary combined facets, recommend crawlable `noindex,follow`, excluded from sitemap; do not rely on canonical to a materially different unfiltered result set. Do not block those URLs in robots while relying on Google reading noindex. Curated SEO collections have their own canonical URLs. At greater scale revisit crawl controls using Google's faceted-navigation guidance.
- Package tabs, gallery views and inspiration modals should not create duplicate canonical pages. Do not publish both old and new detail routes with self-canonicals during transition.

### Future custom domain: `staylocal.buddytechlab.com`

Keep `brand.siteUrl` on the working production host until a separately authorized cutover. Current source fallback and live canonicals use `https://staylocal-v2.vercel.app`; this is correct for today's host, not a current SEO error.

For a later move: verify domain control, add host to intended Vercel project, confirm DNS/TLS, validate routes privately, then set canonical base to `https://staylocal.buddytechlab.com` and update sitemap, robots, OG and structured-data IDs consistently. Confirm HTTPS and an exact host policy; do not invent a `www` hostname. Redirect the old Vercel host to the final custom-host destination, combining path changes where possible to avoid host→old path→new path chains. Include `/trips`, static pages and query handling in tests. Preserve necessary auth/API callbacks deliberately rather than blindly redirecting POSTs or arbitrary hostnames. Check NextAuth origin/session behavior and approved callback configuration as part of the domain release; no env values were inspected or changed here.

Keep old redirects long-lived (at least a year under Google's migration guidance), keep old host crawlable for redirect discovery, and monitor 404s/index coverage. Do not robots-block the entire old host. Verify both GSC properties and use Change of Address if the properties/move qualify. No present DNS state or target-host readiness is asserted.

## Trek vs tour data-model strategy

### Smallest safe distinction

`Trip.category` already exists, is required free text and powers filters/chips; builder choices include Mountains, Islands, Wildlife, Trek, Beach, Hills and Other, preserving unfamiliar existing values. Homepage uses Trekking/Beaches/Culture and prefix matching, whereas `/trips` uses exact category equality. These are theme labels, not an exclusive product taxonomy. `TripPackage` is a variant belonging to a Trip and has no independent category. `Trip.type` is exclusively renderer behavior (`calculator`, `enquiry`, `andaman`).

Recommend **one additive nullable scalar `Trip.productKind String?`**, accepting only `trek` or `tour` in application validation (optionally add a SQL check constraint allowing NULL). Add a `(productKind, status)` index if supported by measured query needs. NULL means unreviewed legacy record and preserves its current route. Prefer explicit nullable classification to silently defaulting every existing record to tour. New records must explicitly select kind before publication once the new editor is released. Existing published NULL records remain editable through the compatibility policy until reviewed.

This is smaller than new parallel Trek/Tour tables, preserves all primary IDs and avoids renderer migration. It is safer than overwriting `category`, which would destroy existing theme filters. Add support to the Prisma type, strict Zod object, explicit allowedKeys/data mapping, builder initialization/payload, list DTOs, route/metadata/sitemap resolver and tests in the same staged release. Older clients omitting the field must retain existing classification; omitted must not clear it. Classification changes on published content require URL impact review.

Backfill is a separately reviewed per-record mapping, not title/keyword inference and not a seed rerun. Retain global slug uniqueness. Store no duplicate Trip just to appear under both hubs; use related-trip links for crossover interest.

### Capability assessment

| Need | Existing support | Recommended extension |
| --- | --- | --- |
| Trek difficulty | `Trip.difficulty`, builder Easy/Moderate/Hard; default Easy; not an expert assessment | Controlled labels with explanation; require reviewed value for newly published treks |
| Maximum altitude / trek distance | Only possible in highlights/itinerary text; Jibhi mentions 3120m | Typed nullable `maxAltitudeM`, `distanceKm`; units explicit; unknown stays null |
| Basecamp / trail region | Free-text location/route, no dedicated fields | `basecamp` plus normalized region/destination IDs when filtering requires them |
| Pickup/drop | Route, itinerary/inclusions prose | Explicit pickup/drop locations and logistics text; do not infer inclusions from route |
| Fitness / safety / gear | Generic FAQs/highlights can describe them; no dedicated schema or publishing requirement | Reviewed fitness, gear, acclimatization/weather/evacuation/guide/permit information with review date; no unsupported safety guarantees |
| Batch dates | `Booking.month` is only a free-text preference; no departure, seats or availability model | Real departure records when operationally needed; no month strings masquerading as inventory |
| Inclusions/exclusions | Trip JSON arrays and per-package JSON arrays; universal renderer falls back to trip values | Reuse, document precedence and derive visible chips from selected package facts |
| Tour destinations | `location` and `route` free text | Preserve; normalize region/destination filtering gradually |
| Itinerary/duration | Trip nested JSON legacy; TripPackage days/nights and flat daily JSON; universal duration config | Reuse packages as numeric duration source; repair missing legacy content by approval |
| INR pricing | Trip price, legacy matrices, TripPackage priceAdult/basis/request flag; universal rules | Reuse calculators; one public summary adapter and explicit quote assumptions |
| Stays | TripPackage accommodation text, tierDetails, Andaman-specific hotel JSON, universal offer stay objects | Reuse adapter; add structured stays only where the existing renderer lacks necessary facts |
| Transport/meals | Itinerary/inclusions prose, legacy tier vehicle/meals, universal tier transport/meals | Reuse; optionally add typed pickup/drop facts, avoid duplicating offer facts |
| Customization | WhatsApp, Booking.message, package-aware modal; homepage requires a published trip | Trip-level custom requests need explicit API semantics; no separate flexible holiday form/backend currently exists |

After the one-field classification release, a separate optional `TrekDetails` relation keyed by `tripId` is appropriate for typed trek facts. Keep safety/fitness narratives validated and server-rendered. This relation is a follow-on, not needed merely to split listing routes. Prefer typed numeric columns for facts used in sorting/filtering; avoid overloading `TripExperience.config` (strict universal pricing version 1) or adding trek facts to pricing matrices.

For actual departures introduce `TripDeparture` with stable ID, trip ID, optional package ID, start/end dates, timezone/date semantics, status and approved capacity/price policy. Validate end ≥ start and package ownership. If enquiries select dates, add nullable `Booking.departureId` and server validation; retain month preference and existing bookings. Seat counts must reflect real inventory operations before showing availability or urgency. Group capacity/holds/payments are beyond this phase and not implied by an enquiry record.

## SEO implementation checklist

- [ ] Central canonical route resolver shared by cards, metadata, sitemap, admin View links and schema; current host until authorized cutover.
- [ ] Unique home/trek/tour/combined-list titles and descriptions; no double brand suffix, empty duration fragment or copied generic paragraph. Optional editorial overrides validated in Builder.
- [ ] One H1 and meaningful H2 sections; page content, actual price basis, location and duration in initial HTML. Keep published-only gate and true missing/draft 404/noindex.
- [ ] Default 1200 × 630 share image plus trip-specific image; explicit OG/Twitter URL/title/description/image per canonical page. Preserve `en_IN`; English content does not require fabricated language alternates.
- [ ] Sitemap includes all and only canonical published content, accurate content timestamps and intentional freshness. Publishing, unpublishing, classification and metadata edits invalidate it. Detect DB failures and stale/partial output.
- [ ] Robots points at canonical-host sitemap, protects crawl space without blocking assets or preventing necessary noindex/redirect discovery. Explicit private/preview noindex strategy; robots is not access control.
- [ ] Server-rendered JSON-LD using verified Organization or TravelAgency identity, WebSite, BreadcrumbList, ItemList and semantically appropriate TouristTrip/Offer data. Confirm vocabulary against schema.org before implementation. Escape `<` when serializing user-managed text in script content. Numeric prices use `priceCurrency: INR`; omit unknown prices/availability, private promotions, unverified ratings and invented aggregate reviews.
- [ ] Do not claim TouristTrip grants a Google rich result, force an unsuitable Product schema or fabricate Event availability. FAQ content is useful, but a travel site should not expect FAQ rich results under Google's restricted eligibility rules.
- [ ] Filter policy, canonicalization and curated landing whitelist documented; no sitemap entries for arbitrary search/sort/query combinations. Real pagination, if introduced, must have crawlable links and appropriate page canonicals.
- [ ] Responsive image sizes, verified remote allowlist, explicit dimensions/aspect ratios, descriptive meaningful-photo alt and empty alt for decorative images. Current empty card alt is not automatically wrong because the enclosing link already names the trip.
- [ ] Request-level deduplication, batched public price reads and measured cache strategy; no caching of private enquiries or personalized quote data.
- [ ] Indian mobile lab baseline before changes; measure throttled landing/detail/filters/calculator interactions. Gather real-user p75 LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 separately for mobile/desktop. No current metric values or pass/fail are asserted.
- [ ] Complete redirect crawl, HTTP/HTTPS/host checks, social preview verification, structured-data validation, GSC URL inspection and publication-to-sitemap freshness verification.

CWV risks are the heavy hero/poster/video, eager raw images and many carousel cards (21 images on homepage at measurement), repeated DB queries, force-dynamic response time, broad hydrated page components, repeated routing from filters and reveal animations. Homepage GET showed `private, no-cache, no-store` and a Vercel MISS in one sample; that is evidence of this response, not a performance benchmark. `next/font` self-hosted font optimization and reserved image containers are existing positives. The installed Image guide deprecates old priority usage in favor of current preload/loading/fetchPriority choices; select these deliberately rather than applying obsolete patterns everywhere.

## UI/UX recommendations

### Homepage and section landings

Keep the green/cream brand, editorial typography, founder voice, real-human contact, transparent estimate copy and existing policy links. Make the product decision visible immediately: **Himalayan Treks**, **Domestic Tours**, **Customize a Holiday**. Use actual approved imagery and inventory rather than implying all inspiration cards are live fixed departures.

Place separate preview sections for real trek/tour inventory with crawlable “View all” links. Show price basis, numeric duration and destinations on tour cards; add reviewed difficulty, altitude and nearest real batch on trek cards. Hide unavailable facts. Avoid default Easy badges on every holiday. Normalize destination links so selecting a region actually returns its Trips. Keep the combined `/trips` view useful for uncertain travelers.

Each hub needs an intent-specific title/H1, concise original intro, visible result count, responsive card grid, filters, genuine advice and related navigation. Trek filters: region, difficulty, days, altitude band, price and departure month only when backed by structured data. Tour filters: destinations, days, budget and travel style only when stored. Keep mobile filter sheet/reset and shareable URLs; make chips/touch targets readable and announce updated counts. Do not publish an empty trek catalogue as a substantial booking section before real approved trek products exist.

### Shared detail layout

Use a reusable server-rendered content shell around independently preserved interactive pricing modules:

1. Breadcrumbs → section, destination and Trip; hero/title/short summary.
2. Compact facts: selected duration, starting-price basis, route/pickup/drop; trek-specific reviewed difficulty/altitude/distance/basecamp.
3. Short overview and package/departure chooser; clear per-person vs total estimate, taxes/sharing/date assumptions and request-price states.
4. Itinerary with all day text present in HTML; native details accordions are preferable to conditionally mounting all closed descriptions.
5. Selected stays/transport, inclusions/exclusions, notes and customization.
6. Trek fitness/gear/safety/permits and real dates; tour flexibility/seasonality and logistics.
7. Cancellation link, real support commitments, relevant FAQs and related canonical Trips.
8. Consistent enquiry/WhatsApp CTA, selection preserved into modal, sticky mobile action with safe-area/footer/form clearance.

Do not make the entire shared shell a Client Component solely for calculator state. Keep selected-offer updates accessible while ensuring a useful default offer and complete overview render on the server. Existing universal `<details>` renders descriptions in HTML; `PackageItinerary` currently mounts only the open day's description. Avoid removing existing working renderer paths during this layout change.

### Trust and enquiry details

Add verified team identity, authentic trip photography and operator credentials/reviews with permission when provided. Do not invent certifications, customer counts, testimonials or guarantees. Reconcile stated 24/7 and working-hours promises. Present advance/payment/cancellation information accurately before commitment; current cancellation page explicitly says terms vary by trip.

Preserve API validation, errors, fallback and duplicate suppression. Fix the generic-vs-selected offer enquiry contract; a “Customize” CTA should allow an honest general request without falsely assigning a random Trip. Preserve phone/email privacy. Legacy calculator enquiries without a package ID do not carry a persisted duration/tier selection in the current contract; add a validated selection snapshot only with reviewed backward compatibility. For non-universal package modal traveller edits, displayed estimate uses the initial count while server recomputes submitted people: make the displayed estimate follow the same selected count. Never count a WhatsApp click as an enquiry already saved.

## Search Console and analytics requirements

No current account access or credentials are claimed. Request owner access to the existing production URL-prefix GSC property (if it exists) and the future host property; verify the future Domain property via owner-controlled DNS or an appropriate URL-prefix verification mechanism. A future verification meta token must come from the owner and appear only on the intended environment. Record coverage, clicks/impressions/query groups, selected canonicals, backlinks and CWV before migration. Submit canonical sitemap after release and inspect both hubs, representative details and redirects. Domain-wide access must not be assumed merely because the target is a subdomain.

Choose GA4 or another owner-approved analytics system with supplied property/measurement IDs and a documented privacy/consent policy. No IDs should be guessed. Suggested events: `view_trip`, `select_package`, `filter_trips`, `begin_enquiry`, `enquiry_success`, `enquiry_error`, `whatsapp_click` and `customization_request`. Event fields can include non-personal trip ID/slug, kind, package ID, duration and INR estimate. Never send name, email, phone, message, promo secrets or WhatsApp text/URLs containing personal data.

Track success after API persistence acknowledgment, deduplicate duplicate-success responses and avoid counting the following WhatsApp popup as another saved lead. WhatsApp-only journeys are outbound intent, not proven conversions. Set production-only collection, preview/local suppression and host segmentation. Validate App Router navigation without double page views. Real-user vitals collection can complement GSC/CrUX; no current traffic volume or availability of field reports is assumed.

## File-by-file implementation plan (proposed; not executed)

| Files | Planned responsibility |
| --- | --- |
| `prisma/schema.prisma`; new reviewed file under `prisma/upgrades/` | Add nullable product kind first; optional TrekDetails/departures later; keep IDs/legacy columns untouched |
| `lib/trip-schemas.ts`, `lib/content-validation.ts` | Strict classification/new-facts validation and explicit whitelist/data mapping; retain omitted existing values |
| `lib/trip-builder.ts`, `components/admin/TripForm.tsx` | Initialize/persist kind, conditional trek fields, publication messages, accurate summary/preview |
| `lib/trip-publish.ts` | New-record kind and trek readiness checks with explicit legacy compatibility |
| `app/api/admin/trips/route.ts`, `app/api/admin/trips/[id]/route.ts` | Transaction-safe fields and classification-change URL review; preserve concurrency/ownership/delete protections |
| `components/admin/PackagesEditor.tsx`, `builder/BuilderControls.tsx`, `builder/UniversalEditor.tsx`, `builder/PhotoEditor.tsx` | Reuse current packages/editor/photo behavior; extend only facts actually needed, preserve pricing controls |
| New `lib/trip-urls.ts` | Shared current/canonical route and reviewed transition resolver |
| New `lib/public-trip-summary.ts`; `lib/public-trip-prices.ts`, `lib/universal-store.ts`, `lib/universal-trip.ts` | Uniform public price/duration/fact summaries across renderers; batch loading without changing arithmetic |
| New shared published-trip loader; `app/trip/[slug]/page.tsx` | Reuse data/metadata lookup; legacy rendering until mapping approved, then permanent redirect |
| New `app/treks/page.tsx`, `app/tours/page.tsx` | Server-fetched classified hubs with unique metadata/copy and reusable filtering |
| New `app/treks/[slug]/page.tsx`, `app/tours/[slug]/page.tsx` | Published-and-kind-gated canonical detail entrypoints using existing renderer dispatcher |
| `app/page.tsx`, `components/Hero.tsx`, `Navbar.tsx`, `Footer.tsx` | Primary section navigation, clear search/customization, retain founder/contact/policies |
| `components/TripCard.tsx`, `TripsBrowser.tsx`, `Discover.tsx`, `FeaturedCarousel.tsx`, `CategoryCircles.tsx` | Canonical links, numeric filters, normalized labels, full-width mobile cards and accessible controls |
| `components/DestinationsCarousel.tsx`, `FounderSection.tsx`, `CuratedTrips.tsx`, `TravelByStyle.tsx`, `PlannerSheet.tsx`, `SearchBar.tsx` | Valid destination matching, remove broken experience links, distinguish inspiration, honor collected preferences |
| New shared trip content shell/facts/breadcrumb components; `components/trip/CalculatorTrip.tsx`, `EnquiryTrip.tsx`, `UniversalTrip.tsx`, `PackageItinerary.tsx`, `PackagePicker.tsx`; `components/AndamanPage.tsx` | Incremental common layout around preserved calculators, full HTML itinerary, selected-package facts; Andaman parity required |
| `components/BookingModal.tsx`, `EnquiryForm.tsx`, `app/api/bookings/route.ts`, `lib/validation.ts` | Explicit general/selected enquiry contract, accurate traveller estimate and selection snapshots; no weakening of offer ownership |
| `app/layout.tsx`, page metadata exports; new OG image asset/route | Shared metadata defaults, page-specific social cards, avoid inherited home canonical |
| `app/admin/layout.tsx` plus new server metadata layout/wrapper if needed | Admin noindex: current client layout cannot itself export server metadata; retain SessionProvider shell |
| `app/sitemap.ts`, `app/robots.ts`, `lib/config.ts` | Fresh canonical sitemap/error handling, robots policies and controlled host base |
| New structured-data helper/component | Verified, escaped server JSON-LD from the same public summary as visible content |
| `next.config.ts`, `lib/image-policy.ts`, public image components | Approved image host policy, responsive optimization; host/path redirects only at approved cutover |
| `components/Reveal.tsx`, `app/globals.css`, trip/builder styles | Visible-by-default content, motion enhancement, responsive sizing/focus/CTA clearance |
| Optional new analytics/vitals client component | Owner-supplied integration and privacy-safe event contract; production gating |
| `__tests__/slug-route.test.ts`, `trip-api.test.ts`, `trip-builder.test.tsx`, `content-validation.test.ts`, `universal-api.test.ts`, `universal-pricing.test.ts`, `universal-ui.test.tsx`; relevant security/isolation tests | Regression coverage for URLs, strict fields, preservation, quotes, metadata and enquiry semantics |
| `scripts/verify-trip-pages.mjs`, new read-only SEO crawl check | Remove hardcoded `/trip/` and legacy-only price assumptions when routes change; verify sitemap/parity/redirects |
| `staging-tests/admin.spec.ts`, `playwright.staging.config.ts` | Extend meaningful editor/enquiry flows on isolated staging only; never run these writes against public production |
| `package.json`, `eslint.config.mjs`, README and related docs | Review obsolete `next lint` script for installed CLI, document actual fonts/storage/routes and future release checks |

## Safe implementation phases and verification criteria

| Phase | Authorized in this audit? | Work and completion gate |
| --- | --- | --- |
| 1. Evidence/report | Yes; completed | Audit document only. Public checks and source review; no app/data/config changes. |
| 2. Current correctness | No | Proposed fixes for broken links, metadata formatting, sitemap freshness, public price/duration consistency and visible content resilience. Staging crawl must match published inventory; numeric prices and basis agree with each default/starting offer; saved leads unchanged. |
| 3. Additive classification | No | Reviewed nullable schema change and rollback-compatible application support on isolated DB. Old records/payloads retain values, no slug/type/price change; explicit review map. Test admin/editor permissions, stale edit and deletion guards. |
| 4. Hubs and canonical route transition | No | Build real-content treks/tours hubs, shared URL/metadata/schema resolver, preserve combined hub. Every mapped old URL permanently redirects to one correct canonical detail; unclassified legacy URLs still work; wrong-kind/draft/unknown return true 404; no duplicate self-canonical copies. |
| 5. Product facts and layout | No | Trek facts and optional real departure management; common shell around renderer paths. Validate facts/units, package precedence, mobile interactions and operator-approved content. Legacy/Andaman/universal quote parity must pass before any renderer migration. |
| 6. Measurement and readiness | No | Supplied GSC/analytics setup, no-PII event validation, controlled mobile lab baseline and later field monitoring. Review findings with actual isolated staging URLs before deployment approval. |
| 7. Domain cutover | No | Separately authorized DNS/Vercel/env/deployment release. TLS, old/new host/path redirects, self-canonicals, sitemap, robots, auth callbacks and enquiries verified; then GSC submission and monitoring. |

Future verification matrix must cover all four current products plus a newly created trek in staging, legacy calculator, enquiry renderer, package renderer, universal enabled/disabled and protected Andaman. Cover single/multiple travellers, price-on-request, unpublished packages, invalid promo, tampered quote input, duplicate enquiry, network errors and missing/draft routes. Do not test persistence through production POSTs.

Compare record IDs/slugs, raw untouched legacy JSON, package IDs/order, approved current prices/rounding and Booking references before/after migrations. Confirm disabled universal fallback and admin-only activation are intact. Rollback must preserve new data; prefer turning off new routing/UI while retaining additive columns over destructive schema reversal. For URLs already indexed, retain correct redirect mappings during rollback.

Run appropriate lint/type/unit checks and isolated browser tests for implementation phases; existing test presence alone is not evidence they passed here. Do not run seed scripts or broad build/staging scripts until their datasource and effects are verified. Crawl first-response status/HTML, not just hydrated DOM; test Googlebot/social metadata as Next 16 can stream metadata differently by user agent. Scroll pages when evaluating reveal behavior, and test keyboard, reduced motion, small screens, modal/sticky overlap and slow mobile networks.

## Reference guidance

Local framework references read: `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`, `05-server-and-client-components.md`, `01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`, and `01-app/03-api-reference/02-components/image.md`.

- [Google: site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) — URL mapping, canonical/link updates, permanent redirects and migration monitoring.
- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) — align canonicals, sitemaps and redirects; canonical signals are not an indexing guarantee.
- [Google: faceted navigation](https://developers.google.com/crawling/docs/faceted-navigation) — control arbitrary filter crawl space deliberately.
- [Google: FAQ rich-result eligibility](https://developers.google.com/search/blog/2023/08/howto-faq-changes) — limited to eligible authoritative health/government sites; no travel-site rich-result promise.
- [web.dev: Web Vitals](https://web.dev/articles/vitals) — field thresholds and p75 measurement, distinct from laboratory observations.

These references support recommendations, not claims about StayLocal's Search Console status. Production behavior above is directly observed; proposed changes remain unimplemented.
