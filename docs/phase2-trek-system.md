# Phase 2 — trekking discovery, details and admin

Implemented locally on 2 November 2026. **Not deployed. No production migration, records, environment files, DNS or domains changed.**

Follow-up: [controlled Kedarkantha acceptance](kedarkantha-acceptance-test.md) records the subsequent draft-only review, code corrections, 375 passing tests and 25 fresh screenshots. The Phase 2 verification counts below describe the original implementation run.

Read first: [design/migration plan](phase2-trek-system-plan.md), [architecture audit](staylocal-trips-seo-architecture-audit.md), [Phase 1](homepage-phase1-implementation.md), [homepage restoration](homepage-restoration.md).

The [Indiahikes reference](https://www.indiahikes.com/kedarkantha-trek) informed the information-depth checklist only. StayLocal's layout, components and copy are original; no reference-site images, route measurements, GPS data, operational claims or prices were imported.

## Review the running implementation

- Local preview: **http://localhost:3120/treks**
- Example detail: **http://localhost:3120/treks/pine-ridge-trek-design-fixture-45dd8d**
- Existing admin: **http://localhost:3120/admin/trips/new**; choose Create Trek or Create Tour.
- Local login credentials are in the private file `/tmp/staylocal-phase2-local.json`. They are disposable local credentials, not production credentials. Do not commit that file.
- The example is deliberately named **Pine Ridge Trek — design fixture**. Its measurements, place names, preparation text, departure dates and prices are artificial test input. Existing photographs illustrate the design and do not document this fictional trek. No coordinates were invented. Every fixture page is visibly labelled, noindexed, excluded from the sitemap and excluded from the general homepage/tour catalogue.

The running preview uses an entirely separate Postgres cluster at `127.0.0.1:55482`, database `staylocal_phase2_fixture`. It contains a synthetic admin, copies of public legacy package information, and locally created test treks/enquiries. No customers or private production records were copied. Upload credentials are explicitly blank in the preview runner, preventing production Blob uploads.

`node scripts/phase2-local.mjs serve` restarts the preview if its local database is still running. `node scripts/phase2-local.mjs build` builds the isolated configuration using webpack. These scripts enforce the exact disposable database URL. `init` refuses a nonempty database; it is not a reset command. The database cluster lives in `/tmp/staylocal-phase2-pg-data`; its tools are mounted at `/tmp/staylocal-phase2-pg-mount/Postgres.app/Contents/Versions/18/bin`. These temporary resources are not a portable production environment.

## What was implemented

### Public discovery

`app/treks/page.tsx` now serves a photographic introduction, compact horizontal image-left cards, and GET filters for region, difficulty, duration, season and price. Options are derived from available published trek data. At 360px the image stays beside the information; browsing does not require horizontal scrolling. Unknown facts are not fabricated. Empty inventory and unmatched filters have useful contact/reset actions.

Classification is explicit. A destination category named Trek, or a title containing a mountain name, does not automatically turn a holiday into a trek. Until real trek records are reviewed and published, the production-configured listing has an honest empty state.

### Dedicated details

`app/treks/[slug]/page.tsx` provides server-rendered hero/facts, route stages, itinerary, departure statuses/prices, inclusions/exclusions, suitability, preparation, packing, weather, altitude/terrain/emergency/operator information, gallery, FAQs and related treks. Mobile has a sticky link to the inline enquiry form. No welcome popup is mounted on trek pages.

The small route component synchronizes stage selection and expandable itinerary days. When operator-reviewed coordinates exist, a keyboard-operable SVG waypoint overview links to those stages and optionally to OpenStreetMap. Dashed links show sequence, **not a surveyed navigation track**. Missing coordinates produce a textual route fallback. Reviewed stage altitudes produce a discrete elevation profile; it does not claim to represent terrain between camps. Descriptions of closed itinerary stages are in the initial server HTML. Native disclosure controls still work without JavaScript.

Dates are manually maintained operator statuses: PLANNED, CONFIRMED, FULL, CLOSED or CANCELLED. Only future/current confirmed dates accept enquiries. Capacity means the declared group limit, never remaining inventory. No live seat counters, invented departures, safety guarantees or automatic itinerary generation were added.

### Existing admin extended

`app/admin/trips/new/page.tsx` offers Create Trek / Create Tour. The latter keeps the existing `TripForm` and its pricing engine. Trek Builder has seven sections: overview, facts, route/itinerary, media, departures/pricing, preparation/safety, FAQs/SEO.

Drafts can be incomplete. Publication requires an explicit review confirmation, a positive INR starting price, required factual/content/media fields, route review when measurements exist, and named operator review of preparation/safety. Coordinates must be paired and valid; route/step IDs, dates and departure ownership are validated. Changing route or safety fields clears the corresponding review checkbox. Existing slugs are protected. Stale edit timestamps fail before changes commit. Existing departures cannot be removed; cancellation preserves enquiry history. Only one route is supported in this phase.

Media reuses `/api/admin/media`, image validation and existing storage. Hero, gallery and day photographs support alt text and captions. URL entry remains available without upload credentials. Live Blob upload was intentionally not exercised against production storage.

Preview is available inline for unsaved work and through authenticated `/admin/trips/[id]/preview`. Preview is noindex and its enquiry action is disabled. Draft public URLs return 404. Existing content-role authentication is reused; no new administration app or auth system was introduced.

### Pricing and enquiries

A trek keeps one existing `Trip` identity and a standard `TripPackage`. The new sidecar stores trek-specific content. Base INR per-person pricing and optional per-departure overrides use the existing `calculatePackageTotal` helper. Listing starting price uses the lowest applicable base/future confirmed departure price; custom dates still use the actual base, and individual dates use their own override/base. FULL/PLANNED prices do not become a misleading advertised minimum.

The existing `/api/bookings` dispatches only explicitly classified treks to the new transactional service. The server rechecks publication, package/departure ownership, open status, date, group limit and authoritative price. Client totals are ignored. It persists an existing Booking plus a `TrekEnquiry` snapshot of departure label and per-person price. The existing admin Bookings page shows that snapshot. Duplicate enquiries are suppressed; changing selections in the duplicate window yields a conflict rather than silently losing the new selection. Tour enquiry and commercial calculation branches are retained.

## Preserved behavior

The approved restored homepage, hero video/effects, Founder Story, welcome popup and `/tours` page are unchanged. Existing tour detail URLs/renderers, calculators, authentication and customer records are preserved. Hash checks cover 11 key files, including `lib/pricing.ts`, `lib/universal-trip.ts`, `CalculatorTrip.tsx` and `AndamanPage.tsx`; see [preservation evidence](../artifacts/phase2/preserved-files.json).

Existing tour records remain unclassified until review. New Tour creation can write explicit TOUR classification after activation. No legacy URL migration occurred. A newly created dedicated trek's legacy `/trip/[slug]` alias returns a 308 to `/treks/[slug]`, avoiding duplicate detail pages.

## Storage and compatibility

`prisma/schema.prisma` adds only related models and enum:

| Model | Purpose |
| --- | --- |
| `TripClassification` | One explicit TREK/TOUR identity, separate from destination category and renderer type |
| `TrekContent` | Versioned, strictly validated JSON plus shared Trip/TripPackage relations |
| `TrekDeparture` | Manual date/status/optional price and capacity records |
| `TrekEnquiry` | Existing Booking's selected departure and quoted per-person snapshot |

No scalar columns were added to existing models. This matters because Prisma's automatic scalar selects must continue to work before the additive SQL exists. `TREK_SYSTEM_ENABLED` defaults off, and disabled mode makes no new-table queries. `TREK_WRITES_ENABLED=0` suspends content authoring while retaining trek reads. Optional reverse relations do not change old scalar queries.

The SQL adds foreign keys, indexes and defensive date/status/positive-price/capacity checks. Enquiry references restrict destructive deletion. Application writes are serializable transactions. Strict JSON versioning is currently version 1; future shapes need a deliberate version migration.

## SEO and performance

- Dynamic, indexable base `/treks` and genuine published details, with canonical metadata, Open Graph and Twitter previews.
- Filter combinations canonicalize to `/treks` and are noindex/follow, limiting faceted duplicates.
- Details render breadcrumbs and factual TouristTrip/Offer JSON-LD. No invented ratings, availability or guaranteed Google rich result claims. JSON-LD is escaped safely.
- Drafts/private previews are inaccessible or noindex. Local fixture mode also noindexes listing/detail and excludes fixtures from sitemaps.
- Request-time sitemap keeps published Kashmir packages and existing tour URLs, includes genuine trek canonical URLs, and excludes incomplete/missing trek content and fixtures.
- Shared discovery cards understand the dedicated canonical URL. Header/footer still provide direct crawlable category links.
- `TrekPhoto` uses responsive Next Image with explicit layout containers, lazy loading below the hero and eager high-priority hero loading. Local, approved Unsplash and Blob images are optimized; other permitted remote image URLs use the original URL, avoiding unsupported-host failures.
- No new map library, tile subscription, tracking integration or animation dependency was added. Essential content and GET filtering do not require JavaScript. The enquiry submission and synchronized waypoint selection do.

## Exact future migration/release requirements

**These are instructions for a separately approved release, not actions performed on production.**

1. Review `prisma/upgrades/20261102_trek_system.sql`, back up the intended database, verify the host/database/role independently, and confirm the existing Trip, TripPackage and Booking baseline. The script is a transactional one-time upgrade, not idempotent; do not rerun over existing sidecar tables.
2. Rehearse against a disposable/staging copy. Supply that reviewed `DATABASE_URL` through the release environment. Do not use `prisma db push`, `migrate dev`, a reset or production fixture seeding.
3. Apply the exact reviewed SQL to the approved target:

   ```sh
   npx prisma db execute --schema prisma/schema.prisma --file prisma/upgrades/20261102_trek_system.sql
   npx prisma generate
   ```

   It creates ProductKind and four sidecar tables; it does not update existing package/customer records. This repository uses explicit upgrade SQL, so this operation does not create a Prisma migrate history entry.
4. Build/release the compatible application with trek activation off first. After checking schema presence, activate `TREK_SYSTEM_ENABLED=1` in the approved release environment. Keep `TREK_WRITES_ENABLED=0` during initial read verification, then enable writing after admin checks. Never enable `TREK_FIXTURE_REVIEW` on a deployment; it additionally requires the exact isolated loopback database and absence of VERCEL.
5. Keep the currently approved public origin in `NEXT_PUBLIC_SITE_URL` and the corresponding authentication origin. The preview uses `localhost:3120` consistently; mismatched localhost/127.0.0.1 origins are correctly rejected by existing admin CSRF checks. No custom-domain switch is part of Phase 2.
6. Review actual operator trek content, media rights, measurements/sources, emergency procedures, dates and prices. Create a draft, inspect private preview, then explicitly publish. Do not promote the synthetic example.
7. Recheck canonical URLs, sitemap, draft 404s, existing tours/calculator totals, admin media, first real trek enquiry and mobile layout on the approved release. Separately verify Search Console ownership/submit sitemap if access is available; no credentials or analytics access are assumed here.

### Safe classification backfill

There is **no automatic backfill**. `scripts/phase2-backfill.mjs` supports only a manually reviewed TOUR manifest, with expected original slug/type/price and unique Trip IDs. Example shape (values must come from reviewed actual records):

```json
[{ "tripId": 123, "kind": "TOUR", "expectedSlug": "reviewed-existing-slug", "expectedType": "calculator", "expectedPrice": 10000 }]
```

That JSON is a format illustration, not an instruction to classify record 123. Obtain the database fingerprint independently: SHA-256 of lowercase `hostname:port/database`, with 5432 as default port. The helper refuses a fingerprint mismatch before querying.

```sh
node scripts/phase2-backfill.mjs --manifest /secure/reviewed-tours.json --database-id REVIEWED_SHA256
```

This defaults to a transactional dry run. Only after its concrete result and target are approved, add `--apply --approved-reviewed-target`. Every manifest expectation is rechecked atomically; conflicting existing classifications abort. No Trip scalar or price is changed. Ambiguous records stay absent. Existing-trip conversion to TREK requires a separate reviewed content/URL/enquiry plan and is deliberately unsupported by this helper or builder.

### Rollback

Before any real trek publication, disable activation and return to the compatible build; retain the additive tables. After publication, set `TREK_WRITES_ENABLED=0`, retain the new read routes, classifications and enquiry snapshots, and repair forward. Do not roll back to a build that loses `/treks/[slug]`, delete snapshots, drop tables, or reclassify published treks without reviewed redirects. Restoring data requires a separately reviewed backup/recovery procedure.

## Files and responsibilities

| Files | Change |
| --- | --- |
| `lib/treks/{schema,flags,store,enquiry,seo}.ts` | Validated content, activation, persistence, pricing/enquiry validation and SEO |
| `prisma/schema.prisma`, `prisma/upgrades/20261102_trek_system.sql` | Additive storage |
| `app/api/admin/treks/**` | Existing-auth creation/edit/read/readiness endpoints |
| `components/admin/{CreatePackageChoice,TrekBuilder,TrekMediaField}*` | Kind choice and dedicated seven-section builder |
| `app/admin/trips/{new,[id]/edit,[id]/preview}/page.tsx` | Existing admin integration and private preview |
| `app/admin/{layout,trips/page,bookings/page}.tsx` | Responsive builder/preview frame, kind labels and enquiry snapshots |
| `components/admin/TripForm.tsx`, `lib/trip-schemas.ts`, existing admin trip APIs | Optional new TOUR classification, guard against cross-builder edits |
| `app/treks/**`, `components/treks/*` | Discovery, detail, map/itinerary/profile, media and inline enquiry |
| `lib/public-catalogue.ts`, `lib/discovery.ts`, `components/TripCard.tsx` | Explicit classification and canonical discovery links |
| `app/api/bookings/route.ts`, `app/trip/[slug]/page.tsx`, `app/sitemap.ts` | Shared enquiry dispatch, new-trek alias and sitemap |
| `next.config.ts` | Approved image optimization hosts |
| `__tests__/trek*`, existing discovery tests | Validation, compatibility, UI interaction, API, price and SEO regression coverage |
| `scripts/phase2-{local,backfill}.mjs`, `scripts/verify-phase2-treks.mjs` | Isolated review, guarded future backfill and authenticated workflow verification |

The working tree also contains the earlier approved Phase 1/restoration changes. They are not newly reverted or reimplemented by Phase 2.

## Verification evidence

- Automated tests: **369 passed, 26 files**.
- TypeScript: `npx tsc --noEmit` passed.
- Production build: isolated `node scripts/phase2-local.mjs build` / `next build --webpack` passed, including the new server routes. No deployment is triggered.
- Default `npm run build` was also attempted and retried outside the sandbox. Turbopack still fails while spawning/binding its CSS worker (`Operation not permitted`), including the existing TripBuilder stylesheet. Webpack succeeds; this local toolchain limitation remains to be checked in CI.
- Full `npm run lint` ran: **21 existing errors, 35 warnings**. Errors remain in legacy components/scripts/tests, including pre-existing TripForm hook/error-boundary warnings promoted to errors. New trek sources/tests/scripts lint with **0 errors**, with one admin `<img>` preview optimization warning. No lint rules were disabled to conceal the baseline.
- Authenticated Chromium integration: **18 checks passed**, **20 screenshots**, no public browser runtime errors, 360px/390px no document overflow. Draft → private preview → publication → stale/bypass/slug/removal protection → tour creation → route synchronization → no-JS HTML/filtering → date-priced enquiry → admin snapshot → duplicate/full/cross-trip protection all exercised against the disposable database.
- The integration test compares all copied legacy tour scalars/packages before and after; unchanged. All copied published tour URLs and `/tours` return 200. Kashmir remains in sitemap. Fixture alias returns 308 and is excluded from sitemap.

See [workflow results](../artifacts/phase2/workflow-verification.json), [preservation hashes](../artifacts/phase2/preserved-files.json) and `scripts/verify-phase2-treks.mjs` for exact assertions. Portable build/test/lint logs and a check summary are retained in `artifacts/phase2/{build,tests,lint-full,lint-new}.txt` and [verification.json](../artifacts/phase2/verification.json).

### Screenshots

| View | Desktop | Mobile |
| --- | --- | --- |
| Trek discovery | [Desktop](../artifacts/phase2/treks-desktop.png) | [360px](../artifacts/phase2/treks-360.png), [390px](../artifacts/phase2/treks-390.png) |
| Trek details | [Desktop](../artifacts/phase2/trek-detail-desktop.png) | [360px](../artifacts/phase2/trek-detail-360.png), [390px](../artifacts/phase2/trek-detail-390.png) |
| Creation choice | [Desktop](../artifacts/phase2/admin-choice-desktop.png) | [360px](../artifacts/phase2/admin-choice-360.png) |
| Create Trek | [Desktop](../artifacts/phase2/admin-create-trek-desktop.png) | [360px](../artifacts/phase2/admin-create-trek-360.png) |
| Create Tour | [Desktop](../artifacts/phase2/admin-create-tour-desktop.png) | [360px](../artifacts/phase2/admin-create-tour-360.png) |
| Draft preview | [Desktop](../artifacts/phase2/admin-trek-preview-desktop.png) | [Editor](../artifacts/phase2/admin-trek-edit-360.png) |
| Additional admin | [Enquiry snapshot](../artifacts/phase2/admin-trek-enquiry-desktop.png) | [Route](../artifacts/phase2/admin-route-360.png), [media](../artifacts/phase2/admin-media-360.png), [departures](../artifacts/phase2/admin-departures-360.png) |
| Other states | — | [Empty filters](../artifacts/phase2/treks-empty-390.png), [preserved tours](../artifacts/phase2/tours-preserved-390.png) |

## Remaining limits and release risks

1. No real trek has been classified, authored or published in production. Verified operator content and the approved additive upgrade are prerequisites to a populated live collection.
2. Operator attestation/source fields record accountability; software cannot independently certify trail accuracy, fitness advice, weather or emergency capability. Review actual content before publication. No safety guarantee is implied.
3. There is no authoritative seat inventory, payments, automatic availability sync, route variants, GPX navigation or transport/add-on pricing in this phase. Capacity is a group constraint only.
4. Blob upload integration is reused and validated, but a real storage write requires a separately authorized staging test. Unapproved remote image hosts render without optimization.
5. Local screenshots/overflow checks do not establish field Core Web Vitals. Measure production/staging on representative devices and monitor real-user data after an approved release.
6. Listing data is currently loaded for filtering on the server; a substantially larger catalogue should move to indexed database pagination/faceting. Version-1 content parsing intentionally fails visibly on malformed records rather than inventing missing facts.
7. Existing lint debt and the local Turbopack worker restriction remain visible release checks. Webpack build, TypeScript, tests and the full isolated workflows pass.
