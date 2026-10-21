# Universal Trip System — local implementation and migration hold

**Implemented locally; NO-GO for production activation.** No push, deployment,
remote database query/mutation, credential change, secret rotation, Vercel setting
change or migration was performed for this task. Existing security release gates
in [production-readiness-remediation.md](production-readiness-remediation.md) remain.

## Architecture and compatibility

One reusable `UniversalTrip` renders all opted-in destinations. Its gallery,
Playfair/DM Sans typography, cream background, 280px hero, 110px duration cards,
200px experience cards, 440px desktop calculator column, green selection states,
stay cards, itinerary accordions and booking summary follow the existing Andaman
page. Mobile has horizontally scrolling selectors and a fixed enquiry action.
The admin preview adapts to its container. No destination-specific page copies.

Existing `Trip` and `TripPackage` scalar columns remain unchanged. The only schema
addition is `TripExperience`, with a trip foreign key, versioned JSON configuration,
an `enabled` switch and edit timestamp. `TripPackage` remains the authoritative
offer selling price, price-on-request flag, duration length, itinerary, inclusion,
exclusion and package publication record. The configuration links package slugs
to duration/tier identities and adds stays, traveller rules, comparison approval,
optional promo selling prices and initial selection. Slugs are resolved only within
the owning trip; package IDs on enquiries must match that trip and configured offer.

The configuration table is deliberately separate. Adding new scalar fields to
Trip would make existing Prisma `findMany` queries select missing columns before
an approved production migration. New table access is gated instead:

1. Global `UNIVERSAL_TRIPS_ENABLED=1` is required. Default is OFF; no environment
   setting was changed. With it off, the additive table is never queried.
2. A specific trip's `TripExperience.enabled` must also be true.
3. Andaman is explicitly excluded from live universal loading and writing,
   regardless of either switch, until its separate migration review is approved.

Existing URLs and legacy strings are not rewritten. Existing AndamanPage,
CalculatorTrip, EnquiryTrip and pricing functions remain available unchanged.
Backfill-only package slugs use reserved `universal-` prefixes; legacy fallback
filters these so migrated packages cannot silently replace the original calculator.
Normal existing packages keep their existing fallback behavior.

For NEW trips, the builder starts with universal content when the feature is
available and requires admin activation before publishing through that flow.
The builder remains compatible with legacy trips when the feature is
off. A global fallback for new trips with special pricing rules needs deliberate
operator review: their original flat package path cannot reproduce custom rules.
Keep those trips unpublished during such a rollback. A stale universal enquiry
submitted after fallback is rejected with 409, rather than silently repriced.

## Pricing and enquiry contract

`quoteOffer` is the single calculation function. Production page initial estimates,
quote endpoint, starting-price calculation and enquiry storage use it on the server.
Only the explicitly labelled admin/local preview calculates interactively in-browser.
The live client refreshes quotes from `POST /api/trips/[slug]/quote`; stale responses
are aborted, failed quotes disable enquiry, and the booking modal refreshes again
if its traveller count changes. Booking POST independently recalculates and ignores
client-supplied estimates. It accepts no cross-trip/draft/unmapped offer.

- Integer rupees for inputs/totals; bounded traveller counts and amounts. Displayed
  per-person averages retain up to two decimal places instead of truncating.
- `total` rounding: `Math.round(base × people × factor)`, matching legacy calculators.
- `person` rounding: `Math.round(base × factor) × people`, matching Andaman.
- Rules explicitly specify inclusive traveller ranges and basis-point adjustments;
  positive is surcharge, negative is reduction. Overlapping/reversed/out-of-range
  rules are rejected. No default discount rule is invented for future trips.
- Promo price is an explicit selling price, lower than regular price; valid public
  codes select it before traveller adjustments. Invalid codes are rejected.
- Price-on-request returns `null` total, never a misleading zero estimate.
- Homepage, trip listing, detail metadata and public trip API use the lowest eligible
  published offer for the standard two-person basis (one if maximum travellers is
  one), excluding promo-code and large-group minima. POR-only trips show “Price on
  request”. Stored legacy `Trip.price` is preserved for fallback, not overwritten.
- Comparison badges/strikethroughs require approval, nonempty evidence and a genuine
  higher comparison price. Percentages are computed and rounded DOWN. Neither the
  old `discount[]` numbers nor `bufferPrice[]` alone establish approval. Surcharge
  rules with approved comparison pricing are refused conservatively.
- Administrators approve/revise comparison pricing and activation. Editors can edit
  permitted content, without granting themselves these permissions. Internal evidence
  and draft-only offers/durations/tiers are removed from public props/API data.

Evidence authenticity is an operator responsibility: code enforces approval,
ownership and arithmetic but cannot prove a historical comparison price is genuine.
No existing Andaman comparison was marked approved, so its proposed preview has no
red discount badges. The component supports the red badges once genuine approved
comparison data exists; tests verify the condition and arithmetic.

Legacy enquiry POST with no package previously stored no computed estimate. That
behavior is unchanged on the legacy path. Once an approved trip switches to
universal, its enquiry gains an authoritative package ID/label/estimate. Numeric
parity below concerns the existing displayed calculator/WhatsApp totals, not a
claim that old null estimates were numeric. Enquiries remain enquiries, not payments.
A conflicting recent duplicate receives 409; matching duplicates retain their stored
estimate. No booking records are backfilled or reinterpreted.

## Builder and publishing safeguards

The five steps remain. Packages & Itinerary adds visual duration cards, optional
tier cards/features, offer-to-package selectors, stays with image URLs, traveller
rules, rounding policy, promo codes and comparison evidence/approval controls.
Package cards continue to edit prices, days/nights and individual itinerary days.
Cards collapse to keep the editor manageable; add/remove/reorder controls preserve
values. Deleting an offer link does not delete its package. Linked duration/tier
removal is blocked until offers are reassigned; package deletion still requires
the existing explicit removal metadata and ownership checks.

Review & Publish includes the complete reusable customer layout preview, with
enquiry actions disabled. It explains the future derived card price and the
preserved fallback price. Save draft/publish and trip-version checks remain intact.
Universal config adds its own timestamp check, saved atomically in the same trip
transaction. Editors cannot activate the layout. First legacy activation requires
an explicit administrator migration confirmation in addition to publish review;
local edits clear that confirmation. Andaman configuration writes remain blocked.

Zod validates structure, identifiers, integer prices, image URLs, traveller limits,
group rules and overall configuration size. Cross-field checks require unique
duration/tier combinations, owned package references, valid initial selection,
named durations/tiers/stays and a complete itinerary for each published offer.
Unfinished named content can be saved in drafts; incomplete activation is refused.
Existing Phase 1 authentication, role checks, media validation, seed/reset guards,
booking transitions and Prisma Preview isolation remain in place.

## Migration mapping and unresolved decisions

Source: the saved public-trip snapshot from the earlier readiness review, now at
`__tests__/fixtures/legacy-trips.json`. It contains trip/package content only, no
Users, password hashes, tokens or customer enquiries. It was NOT refreshed from
production in this task. Fresh read-only parity against the actual deployment must
be separately approved before any remote migration.

| Trip | Prepared mapping | Exact numerical checks | Activation hold |
| --- | --- | --- | --- |
| Jibhi | 3 duration labels × 3 existing named tiers; original per-duration itineraries; 9 draft package offers | 450: all 9 cells, 1–50 people, including existing 4–5 and 6+ group reductions | Card says 9D/8N while options are 3D/2N–5D/4N. Saved card ₹15,000 vs first offer ₹7,500. Owner must approve duration and new starting-price display. |
| Darjeeling | 3 duration labels × 3 price columns; no names or itinerary invented | 450: all 9 cells, 1–50 people, same total rounding/group reductions | Missing tier descriptions, duration summary and all itineraries. Card ₹5,999 vs first cell ₹4,999. Columns labelled “Unlabelled legacy column” only in local proposals. |
| Andaman | 5 durations × 5 existing tiers; exact source-extracted hardcoded itinerary; existing hotels, promo prices/codes, traveller rules and 4N/5D Comfort initial selection | 600: all 25 cells, 1–12 people, regular and promo price paths; per-person rounding | Specialized content remains protected. Comparison approval/evidence is absent. Promo/booking limits, initial selection and all content need explicit final review. |

**1,500 numerical combinations match exactly.** This does not resolve missing
content, demonstrate genuine comparison prices, or authorize changing public card
prices. No hotels, durations, descriptions, itinerary days, discounts or prices
were invented to fill gaps. Jibhi named accommodation features remain as supplied;
named hotel cards are omitted where there are no actual supplied hotel records.

Andaman itinerary extraction reads only the constant block from our own reviewed
AndamanPage source, transpiles it locally and evaluates that isolated block in a
timeout-limited VM. It executes no remote/customer source and never modifies that
page. This avoids creating a second drifting copy of its hardcoded itinerary.

The local preview report temporarily marks candidate packages published IN MEMORY
to show their layout; stored backfill packages are always drafts and config disabled.
The Darjeeling proposal cannot pass activation validation. Andaman cannot be enabled
through the current production API even if its numerical checks pass.

## Local scripts and explicit deployment prerequisites

Generate reports/previews only; this command does NOT connect to a database:

```sh
node scripts/prepare-universal.mjs --snapshot __tests__/fixtures/legacy-trips.json
```

Prepared SQL: `prisma/upgrades/20261021_universal_trip.sql`. It only creates the
additive table if absent. Existing Trip, TripPackage, Booking and User records are
not changed. It is not wired into install/build. Apply only after approved schema
review and verified environment selection; table-shape drift still needs inspection.

Optional Jibhi draft backfill has `--apply-local` but was NOT executed. It refuses
remote hosts, deployed environments, arbitrary transport parameters and database
names outside `staylocal_universal_*`; also requires
`CONFIRM_DISPOSABLE_LOCAL_DATABASE=yes`. Never use a production tunnel. It checks
the source trip fields, uses a serializable transaction, stops on reserved slug
collisions, and does nothing when a config already exists. It cannot activate a
trip or modify its original scalar fields. Unit tests cover idempotent execution,
source changes and collisions; real PostgreSQL application remains unverified.

Only Jibhi local draft staging is implemented. Darjeeling and Andaman backfills
deliberately stop pending owner content decisions/review; they are not guessed or
automatically advanced. There is no generic remote apply mode. Production backfill
requires a separately reviewed/approved operator procedure after these holds clear.

Required rollout order:

1. Complete the prior password/session containment and dependency release gates.
   Production credentials/settings remain untouched by this task.
2. Approve a disposable isolated PostgreSQL/Preview environment; never use production
   for authenticated writes. Apply the additive schema there only, load approved
   sanitized fixtures, and configure Preview database identities and separate auth.
3. Enable `UNIVERSAL_TRIPS_ENABLED=1` there AFTER the table exists. With no enabled
   trip rows, legacy pages remain. No Blob resource is needed for URL-only photos;
   upload tests require separate approved Preview storage.
4. Review Jibhi's duration/card price decision, stage its drafts, complete content,
   verify real transactions/enquiries and activate that trip only. Check homepage,
   listing, metadata, detail and enquiry totals match every published combination.
5. Supply Darjeeling's missing content and approved price policy; prepare/review its
   backfill only after Jibhi passes. Preserve its URL and all original legacy strings.
6. Review Andaman's exact original UI/content, comparison evidence and booking/promo
   behavior LAST. Removing its hard protection requires explicit separate code review
   and approval. Existing Andaman remains fully on its specialized implementation.
7. Only after staging passes, obtain separate approvals for production schema,
   content backfill, global setting/deployment and per-trip activation. This local
   work does not grant any of those permissions.

Fallback: turn off the affected trip row through the secured admin workflow, or
disable the global feature and redeploy with approval. Retain additive data and all
Phase 1 security patches/current secrets; never revert to old vulnerable auth.
For the staged legacy trips, reserved migration packages are excluded and the
original calculator is used. No destructive down migration or data restore.

## Verification and screenshots

Reports: `artifacts/universal-trip/parity.json`, `browser-checks.json` and local
`previews.json`. Preview JSON contains public trip content and local candidate
configuration, no account credentials. Screenshots include all three proposed
destinations at 1440px desktop and 390px mobile, the untouched Andaman reference,
interactive Jibhi mobile and desktop/mobile builder/editor review.

Reproduce the fixture browser review after a successful webpack build:

```sh
node scripts/prepare-universal.mjs --snapshot __tests__/fixtures/legacy-trips.json
node scripts/review-universal.mjs
# In another trusted local terminal:
node scripts/capture-universal.mjs
```

The review server uses Vite and the actual components/font assets, binds localhost
only, imports NO Prisma, loads NO credentials and uses explicitly mocked admin
reads/fixture quote responses. It is a local UI harness, not a production route or
an authenticated integration test. Nothing is sent to production or WhatsApp.

Browser checks passed all six destination/device combinations with zero horizontal
page overflow, browser errors or broken images. Interactive checks cover duration,
tier, traveller quote, viewport-visible sticky enquiry and modal. The embedded full
preview and universal editor passed at desktop/mobile without overflow/errors.

Real isolated-database transactions, migration execution and authenticated Vercel
staging remain release gates. Default Turbopack remains blocked by this machine's
CSS-worker local-port restriction; the supported webpack production build is the
local compatibility check. CI/Preview must verify the default build before release.

Final local results: **318 tests passed across 17 files**, `npx tsc --noEmit`
passed, `git diff --check` passed, and `npm run build -- --webpack` passed production
compilation, TypeScript, prerendering and tracing. The original `npm run build`
was attempted and failed at the documented Turbopack worker restriction.
The prepared authenticated staging suite now also includes a universal draft →
admin activation → public quote → server-priced enquiry workflow; discovery is
checked locally, but execution is pending isolated staging and explicit approval.

## Changed files for this task

| Area | Files |
| --- | --- |
| Shared architecture | `lib/universal-trip.ts`, `universal-store.ts`, `universal-write.ts`, `public-trip-prices.ts`, `legacy-universal.ts`, `universal-backfill.ts` |
| Public layout | `components/trip/UniversalTrip.tsx`, `UniversalTrip.module.css` |
| Builder | `components/admin/builder/UniversalEditor.tsx`, `components/admin/TripForm.tsx`, `lib/trip-builder.ts`, `lib/trip-schemas.ts` |
| Server wiring | `app/api/admin/trips/route.ts`, `[id]/route.ts`, `[id]/universal/route.ts`; `app/api/trips/route.ts`, `[slug]/route.ts`, `[slug]/quote/route.ts`; `app/api/bookings/route.ts`; `components/BookingModal.tsx` |
| Starting-price display | `app/page.tsx`, `app/trips/page.tsx`, `app/trip/[slug]/page.tsx`, `components/TripCard.tsx`, `TripsBrowser.tsx`, `Discover.tsx` (types/data only for the latter) |
| Additive schema | `prisma/schema.prisma`, `prisma/upgrades/20261021_universal_trip.sql` |
| Local tooling | `scripts/prepare-universal.mjs`, `universal-backfill.ts`, `universal-source.mjs`, `review-universal.mjs`, `capture-universal.mjs` |
| Prepared staging | `staging-tests/admin.spec.ts` adds universal authenticated workflow; no remote test was run |
| Tests/evidence | `__tests__/universal-{pricing,api,ui,backfill}.test.*`, `__tests__/trip-builder.test.tsx` (explicit feature-off compatibility and new universal default), `__tests__/fixtures/legacy-trips.json`, `artifacts/universal-trip/*`, this report |

The workspace also contains the earlier uncommitted security/Trip Builder work;
that work was retained. No new dependency update, homepage redesign, credentials
or environment file was introduced by the Universal Trip task.
