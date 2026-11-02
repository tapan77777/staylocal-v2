# Phase 2 — trek system design and migration plan

Prepared before implementation, 2 November 2026. Read the SEO architecture audit, Phase 1 implementation and homepage restoration reports. Preserve the approved homepage/popup, existing tour URLs, Tour Builder, commercial calculators and enquiries.

Reference studied: [Indiahikes Kedarkantha documentation](https://www.indiahikes.com/kedarkantha-trek). It demonstrates the value of explicit day/stage facts, departures, preparation and operator context. This is a content-depth reference only; no UI, copy, prices, images, coordinates or safety policies will be imported.

## Compatible storage

- Keep existing `Trip`, `TripPackage` and `Booking` scalar columns intact. Prisma's default selects must continue to work against the pre-upgrade database.
- Add related `TripClassification` with explicit `TREK`/`TOUR`; missing means unreviewed legacy, not an inferred classification. Destination category and renderer type keep their current meanings.
- Add versioned, validated `TrekContent`, operator-managed `TrekDeparture` and `TrekEnquiry` selection snapshots. Treks retain shared Trip IDs/slugs, a standard TripPackage and the existing Booking pipeline.
- Gate access to new tables with `TREK_SYSTEM_ENABLED=1`, set only after the reviewed additive SQL is applied to the intended database. Default off means no queries to these tables. New trek writes additionally honor `TREK_WRITES_ENABLED=0` for read-preserving rollback.
- Never classify existing records automatically. New Tour creation may explicitly create a TOUR classification when storage is enabled. Existing tours remain editable unclassified.
- A new dedicated trek can be created/edited only through Trek Builder; legacy tour write APIs must not bypass its publication checks. Published legacy-to-trek conversion is excluded pending a reviewed URL/content mapping.

## Product design

- `/treks`: photographic hero and concise intro; SSR GET filters populated only from real data. Compact horizontal cards, left image/right facts at 360px; no horizontal browsing carousel. Honest empty state if no explicit published trek exists.
- `/treks/[slug]`: SSR hero, facts, stage text, dates, inclusions, preparation, safety, gallery, FAQs, related links and enquiry. Small interactive islands connect authored route waypoints and native itinerary details. Unknown coordinates get a textual route; verified camp elevations get a discrete stage profile, never an invented continuous trail trace.
- One documented route per trek for this phase. Avoid a half-supported route-variant/pricing matrix.
- Dates are operator-confirmed status, not live inventory. Optional group capacity is not remaining seats. INR per-person price plus optional departure override uses the existing total multiplication helper; no new tour discounts/add-ons are introduced.
- Native, accessible inline enquiry and a sticky mobile link to it; use the same `/api/bookings` validation/persistence flow. Server validates selected departure, ownership, status, dates and effective price; never trusts a client estimate.
- Reuse authenticated image upload endpoint and file validation. Store captions/alt text and reuse real image URLs; no new storage service.

## Builder and publication gates

Existing admin entrypoint offers Create Trek / Create Tour. Tour selection enters the existing TripForm. Trek Builder has Overview, Facts, Route & Itinerary, Media, Departures & Pricing, Preparation & Safety, FAQs & SEO, with draft, local preview, reviewed publication and edit-version checks.

Validate strict shapes, image URLs, numeric ranges, dates/order, unique day/departure identifiers and coordinate pairing. Require enough actual content for publication, an explicit operator review, and evidence before displaying numerical route/elevation claims. Do not generate GPS, dates, stock, medical advice, or safety guarantees. Reject slug changes and cross-type edits. Keep existing departure records rather than deleting enquiry history.

## Controlled implementation and verification

1. Record this plan and preserve prior changes; prepare schema and additive SQL, without applying to production.
2. Implement validated storage/services/APIs, guarded new-kind choice and Trek Builder.
3. Implement listing/detail and shared URL/sitemap/metadata resolution without moving tour URLs.
4. Connect only actual published TREK classifications. Test fixture data only in a disposable loopback database, clearly labelled and noindexed, excluded from production discovery/sitemap.
5. Unit/API coverage plus isolated authenticated browser creation → draft → preview → publish → edit → enquiry. Verify wrong-kind/draft/missing 404s, no-JS HTML, SSR metadata, no fabricated coordinates, stable 360px layout, and unchanged tour price parity.
6. Run TypeScript, lint, automated tests and production build; capture desktop/360px public/admin screenshots. Document actual failures/limitations rather than claiming unrun checks.

## Release and backfill boundaries

No deployment, DNS/env-file changes, production records, production migration or seed execution. Prepare exact SQL and deployment instructions for later review. Backfill requires a manually approved Trip-ID manifest with original slug/type/price expectations; classify TOUR first only when verified, leave ambiguous records absent. Trek conversion needs separate content and URL review.

Rollback normally suspends new writes while retaining the additive tables and canonical published trek reads. Do not drop tables, delete classification/booking snapshots or restore an old build lacking published trek routes. Before any new trek publication, full feature disable is safe; after publication, preserve the new read routes until reviewed redirects or forward repair exist.
