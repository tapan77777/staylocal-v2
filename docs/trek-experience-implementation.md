# Reusable Trek experience — implementation and verification

Implemented locally on 3 November 2026. No production records, settings, migrations or deployments were changed. Tours, homepage, popup, shared pricing and booking API source are unchanged; protected-file hashes are recorded in `artifacts/trek-experience/protected-files.json`.

## Delivered

- Horizontal trek cards with destination, difficulty, duration, altitude, basecamp and confirmed starting price, or “Enquire for pricing”. Existing filters and detail URLs remain intact.
- Shared detail template: photographic hero, highlights, quick facts, original illustrated map with keyboard-accessible zoom, route timeline and synchronized expandable itinerary, daily terrain/stay/meal information, preparation, seasons/weather, accommodation, meals, transport, inclusions/exclusions, interactive packing checklist, safety, option-specific departures, gallery, FAQs and mobile enquiry action.
- Existing seven-section builder extended with map media/review fields, daily detail, accommodation/meals/travel, multiple pricing options and private net costs/derived margins. Media uses the existing uploader. No second builder.
- Each option has stable shared package identity, pickup/drop, inclusions/exclusions, publication state, price confirmation and assigned departures. Starting prices use only published, confirmed selling prices matching the stored package price. Unknown prices use the existing WhatsApp enquiry path. No date or seat availability is fabricated.
- Server validation rejects foreign option/departure combinations, unconfirmed or inconsistent prices and publication of fixtures/provisional content. Operator and safety review requirements remain mandatory.
- Operator costs are held outside public content in a versioned JSON envelope and returned only through authenticated admin reads. Selling prices are never inferred from costs. Existing legacy flat content and single-package treks remain readable.

## Local Kedarkantha example

Authenticated preview: http://localhost:3120/admin/trips/16/preview (existing local admin login). Local server remains available on port 3120.

The existing isolated fixture was updated, not duplicated. It remains draft, fixture-marked, provisional and enquiry-only: six days/five nights, Sankri, Moderate, candidate summit altitude 3,810 m and proposed stages through Juda Ka Talab/base camp. Both example options are drafts with no prices, departures or private costs. Operational details and imagery remain explicitly subject to review. Draft enquiry actions are disabled deliberately.

The original StayLocal SVG is an artistic concept, not a surveyed navigation map. It includes that warning and cannot be certified as a verified map at publication. No Indiahikes text, photographs or map assets were copied; its [Kedarkantha page](https://www.indiahikes.com/kedarkantha-trek) was consulted only for information depth.

## Verification

- Focused Vitest suite: **70 tests across 10 files passed**, including tour pricing compatibility, public inventory/SEO exclusion, private-field projection, option ownership, mirror-price mismatch, enquiry-only flow and publication controls.
- TypeScript passed; webpack production build passed using the isolated local database.
- Focused ESLint: zero errors; four warnings (native SVG image elements and unused destructured projection fields).
- Browser checks cover all seven builder sections at desktop/360px; detail, horizontal cards, map zoom/Escape and itinerary at desktop/390px/360px; gallery loading; no horizontal overflow; no browser errors; preview noindex; fixture public 404, listing/sitemap exclusion and enquiry rejection. Legacy local tour records/packages remain unchanged.
- Evidence, logs and 24 screenshots: `artifacts/trek-experience/`. Browser checks exercise the local draft without publishing it. Confirmed pricing paths are tested with isolated unit mocks, not invented live inventory.

Commands:

```sh
npm test -- __tests__/trek* __tests__/pricing.test.ts __tests__/public-catalogue.test.ts __tests__/trip-api.test.ts
npx tsc --noEmit
node scripts/phase2-local.mjs build
node scripts/phase2-local.mjs serve
node scripts/review-trek-experience.mjs
```

The browser script refuses any database URL except the fixed loopback fixture database, verifies isolated-review readiness and only updates the existing draft. It never creates or publishes a trek.

## Migration, rollback and production blockers

**No additional SQL migration is needed for this work.** Existing `TripPackage`, `TrekContent`, `TrekDeparture`, `Booking` and `TrekEnquiry` storage is reused; `prisma/schema.prisma` is unchanged. If the original trek schema is missing, `prisma/upgrades/20261102_trek_system.sql` remains required, subject to verified production database identity, backup and explicit approval. No migration was executed here.

New writes use JSON storage envelope version 2, while the new reader accepts both old and new formats. A rollback after new writes must retain this reader; suspend trek writes rather than deploy an older reader that rejects the envelope. Saved option keys cannot be deleted or renamed; retire options as drafts to retain historical identity. Departure-price overrides are supported on legacy treks; option-based treks must clear them and set selling prices on their options.

Before production activation: verify the actual production database and restorable backup, check the original trek schema, approve deployment/flags separately, replace fixture content with operator-reviewed real content, and complete safety/media/route review. Production trek flags remain disabled. Kedarkantha has no confirmed selling price or dates; enquiry-only publication is supported once all non-pricing publication checks pass. Do not publish or import the local design fixture.

## Exact changed files

The complete source/document/artifact manifest is `artifacts/trek-experience/changed-files.txt`. Changes are confined to trek schema/store/enquiry code, trek public components/detail entry, the existing Trek Builder/private preview, focused tests, local review tooling, the original concept illustration and this documentation. No tour or global layout file changed.
