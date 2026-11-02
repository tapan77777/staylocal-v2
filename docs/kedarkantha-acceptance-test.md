# Kedarkantha — controlled Phase 2 acceptance

2 November 2026. Read `docs/phase2-trek-system.md` completely before testing.

**Result: local functional acceptance passed after code-only corrections. Production release still requires the gates below. Kedarkantha remains an unpublished DRAFT. Nothing was deployed; no production records, migrations, environment files, DNS or domains were changed. No migration was applied during this acceptance session.**

## Review the draft and evidence

- [Saved Kedarkantha preview](http://localhost:3120/admin/trips/16/preview)
- [Edit the draft](http://localhost:3120/admin/trips/16/edit)
- [Public discovery](http://localhost:3120/treks)
- Local login: `/admin/login`. Disposable credentials are in the private `/tmp/staylocal-phase2-local.json`; they are not production credentials and must not be committed.
- [Machine-readable acceptance results](../artifacts/kedarkantha-acceptance/results.json), [browser log](../artifacts/kedarkantha-acceptance/browser.txt), [preservation checks](../artifacts/kedarkantha-acceptance/preserved-files.json).

Preview remains running on `localhost:3120`, against only `127.0.0.1:55482/staylocal_phase2_fixture`. The browser independently checks authenticated server readiness before writing. External upload credentials are blank. The harness marks its new UI-created record as a fixture and refuses browser requests that would publish it. The published Trip ID set is compared before/after and is unchanged. Earlier synthetic fixtures are retained; none were published by this acceptance run.

The draft's public `/treks/kedarkantha-acceptance-draft-1d11aa` URL deliberately returns 404. Screenshots of the detail design use the authenticated preview, which renders the same TrekDetail component inside the admin frame. Public listing/enquiry tests use the already existing, visibly labelled Pine Ridge fixture; Kedarkantha was never made public just to obtain screenshots.

## Scenario and source boundaries

The title is **Kedarkantha — acceptance draft (not offered)**. Sankri and Kedarkantha are supported by the [Govind Sanctuary route page](https://gwsandnp.in/explore-ind.php?id=1). The [Uttarakhand Tourism Kedarkantha entry](https://www.uttarakhandtourism.gov.in/treks-details/Kedarkantha%20Winter%20Trek) also identifies the Juda ka Talab approach in its indexed description; the page itself returned a script/iframe shell to the research reader. Only those place names and basic regional context informed the draft.

The **six-day allocation is an illustrative editorial proposal**, not a verified operator itinerary. Exact route measurements, coordinates, elevations, difficulty, pickup/drop, seasons, capacity and operating arrangements remain unasserted. Source routes/numerical summaries were not interchangeable, so no numerical facts were imported. No safety policy, medical advice, emergency response capability or operator identity was invented.

Persisted draft facts:

| Field | Saved value |
| --- | --- |
| Identity | Trip 16; explicit TREK; fixture marker true |
| Publication | Draft; public detail and raw JSON return 404 |
| Price | Null; no commercial quote |
| Departures | Empty; no confirmed or planned departures persisted |
| Stages | Six clearly labelled proposed days; distances, times, altitude and coordinates empty |
| Operator review | False; reviewer and review date blank |
| Media | Existing StayLocal mountain assets, captioned as illustrative and not verified Kedarkantha photography |
| FAQs/SEO | Original test copy identifying the private, unbookable draft |

Invalid values were entered temporarily to exercise validation, then removed **before saving**. No invented rates, dates or numerical trail claims were persisted for Kedarkantha.

## Acceptance results

**14 workflow groups passed**, producing **25 screenshots**. `scripts/acceptance-kedarkantha.mjs` records the exact actions and guards. It is separate from the earlier Phase 2 workflow script, which includes publication; that older publishing workflow was not run for this task.

| Area | Result and evidence |
| --- | --- |
| Admin → Create Trek | Both creation choices present; entered the existing admin Trek Builder |
| Overview | Title, slug, region, destination, summary, description, proposed duration and highlights authored through UI; empty title rejected without API write |
| Trek facts | Basecamp/context saved; out-of-range altitude rejected; unknown difficulty/measurements/pickup/drop remain blank |
| Route & itinerary | Six proposed days authored through UI, travel/walk distinctions retained; unpaired coordinates rejected and removed |
| Media | Hero, two gallery photos and a day photograph saved with alt text/captions; all preview images loaded; no external upload write |
| Departures & pricing | Negative price and reversed date range rejected; temporary unsaved departure removed; persisted price null and dates empty |
| Preparation & safety | Explicit draft placeholders saved, without operator identity, verified review or a safety promise |
| FAQs & SEO | FAQ and metadata saved; publication readiness correctly reports missing commercial/operator facts |
| Save/edit/reload | Actual POST/PUT succeed; edited summary survives reload; stale edit rejected with 409 |
| Publishing controls | UI blocks incomplete publication even after checking review; server rejects missing confirmation with 409; fixture-marker removal rejected with 409; record and published ID set unchanged |
| Preview and interaction | Desktop, 390px and 360px layouts checked; keyboard/native itinerary interaction and same-stage reopening work; textual map fallback instead of invented GPS; preview enquiry disabled |
| Public isolation/SEO | Draft detail and raw JSON 404; unauthenticated private preview redirects; noindex preview, no offer JSON-LD, no draft/fixture sitemap entries; published Kashmir URL retained |
| Discovery/enquiry | Horizontal image-left cards at 390/360px, no document overflow, GET region filter and empty state; no open dialog; direct draft enquiry rejected without Booking write |
| Tours/pricing compatibility | Existing published tour URLs and `/tours` respond 200; copied tour/package data hashes unchanged; existing labelled local fixture enquiry persists server-calculated departure total and selection snapshot |

The supporting fixture enquiry uses its **existing synthetic** ₹7,200 departure override for three people, yielding ₹21,600 in the existing Booking plus TrekEnquiry snapshot. That is not a Kedarkantha price. No WhatsApp message or external email was sent.

## Defects found and corrected

| Severity | Defect | Safe correction |
| --- | --- | --- |
| High | Legacy public `/api/trips` and `/api/trips/[slug]` could return a locally published fixture without the fixture warning shown by dedicated trek components | Added `publicInventoryOnly` in `lib/treks/store.ts`; both JSON endpoints now exclude fixture/missing-content classified treks while retaining real published treks and legacy tours. Before activation, no new-table query is made |
| High | A direct authenticated edit could clear an existing fixture marker, risking promotion of test content into normal inventory | Existing fixture marker cannot be stripped; save rejects with 409 before shared record writes. A real product must be separately authored/reviewed |
| Medium | After manually closing a selected native itinerary disclosure, selecting the same route stage did not reopen it because React state had not changed | `TrailOverview.select` explicitly reopens the referenced disclosure. Added regression test; actual keyboard-close → route-reselect now passes |
| Medium | Muted labels/captions failed WCAG text contrast, including 27 nodes in the initial builder check and a remaining enquiry eyebrow | Darkened trek-specific text and input boundaries in TrekBuilder/Treks CSS; adjusted profile labels. Approved homepage/tour styles were not changed |
| Low | Fixture banner described every fixture as a fictional trail with simulated dates/prices, even when a real place draft had no such values | Generalized the warning to review content/illustrative imagery and non-offer status |

Changed implementation files for these corrections: `lib/treks/store.ts`, both legacy public trip GET routes, `components/treks/{TrailOverview,ElevationProfile,TrekDetail}.tsx`, `components/treks/Treks.module.css`, and `components/admin/TrekBuilder.module.css`. Added/extended compatibility, route-interaction and fixture-environment tests; updated the older verification script's warning-text assertion. No schema/migration or commercial pricing utility changes were needed.

## Accessibility, SEO, performance and links

**Accessibility:** ten scoped axe runs returned **zero violations** for WCAG 2 A/AA and 2.1 AA tags: all seven builder sections, the final review section, the 360px draft detail and the 360px listing. Image-backed contrast still produces manual-review/incomplete entries; this is not a claim of full accessibility certification. Keyboard stage buttons, native disclosure Enter behavior, visible focus, labelled controls and disabled preview submission were exercised. No horizontal document overflow at tested widths.

**SEO:** the private preview is noindex and contains no offer structured data. All six stage descriptions are present in server HTML, including closed stages. Essential preview content works with JavaScript disabled. Public draft isolation, facet behavior, canonical/sitemap logic and fixture exclusions are also covered by automated tests. The public listing remains directly accessible and does not mount the welcome popup. Actual indexability of a newly published real trek was not tested by publishing Kedarkantha.

**Loading:** all supplied hero, day and gallery images loaded with alt text. Warm, unthrottled localhost measurements recorded zero observed layout shift for the three preview sizes; total transferred resources were approximately 365–447 KB. The first measured 390px public listing transferred about 292 KB; the next 360px navigation reused browser caches. Timing/resource details are in `results.json`. These are local observations with browser caching, not mobile-network benchmarks or production Core Web Vitals. A throttled staging run and field monitoring remain release tasks.

**Links:** preview anchor targets exist. Its internal `/`, `/treks`, `/privacy` and `/cancellation` links return 200. Existing published tour detail routes return 200; Kashmir remains in sitemap. External WhatsApp/source URLs were not used to send messages or assessed as operational promises. This was a targeted journey audit, not an exhaustive crawl of every historical page.

## Migration safety, compatibility and rollback

Inspected `prisma/upgrades/20261102_trek_system.sql` and the complete Prisma schema. Its core matches `prisma migrate diff` from the saved pre-Phase-2 schema. Only the ProductKind enum, four sidecar tables, their indexes/FKs and defensive checks are introduced; no ALTER targets existing Trip/TripPackage/Booking tables. Prisma validation passed using an explicitly supplied local database URL. Read-only inspection confirmed **35 constraints** on the additive tables in the disposable database; see [constraint evidence](../artifacts/kedarkantha-acceptance/database-constraints.json) and [schema diff](../artifacts/kedarkantha-acceptance/schema-diff.sql).

The upgrade is transactional but **not idempotent**. Verify target identity, baseline and table absence before its one-time execution. Existing records are not automatically classified. New-table access defaults off, and tests verify zero sidecar queries before activation. New columns do not alter old automatic scalar selects. Enquiry FKs restrict deletion of referenced data; cancellation retains departure history.

Before any real publication, feature disable and compatible code rollback are possible while retaining the additive tables. After publication, suspend **trek authoring** with `TREK_WRITES_ENABLED=0`, retain `TREK_SYSTEM_ENABLED=1` and the dedicated public read routes, and repair forward. This authoring switch does not disable customer enquiries or tour administration. Do not drop tables, delete snapshots or revert to a build missing published trek URLs. Any recovery restore requires separate approval and a verified backup.

### Fixture protection boundary

- Fixture writes require explicit review mode, the exact disposable loopback database name and absence of VERCEL; tests also exercise deployed-runtime rejection.
- Fixtures retain a visible warning and noindex, produce no offer JSON-LD and are omitted from the sitemap/general catalogue/legacy JSON endpoints.
- Existing fixtures cannot lose their marker through Trek Builder API edits. Drafts cannot accept enquiries or appear in discovery.
- The deliberately labelled public sample accepts test enquiries only in the isolated local fixture runtime. It is not inventory for deployment.
- These controls do not replace database governance: never copy the fixture database into production, import fixture rows through raw SQL, or deliberately re-author synthetic material with its marker removed. After genuine publication, do not use the pre-migration feature-off fallback as an operational rollback. No production data inspection or certified production-cleanliness claim is made without approved access.

## Automated checks and remaining blockers

- **375 tests passed / 26 files**, including fixture visibility/promotion, deployment-runtime fixture rejection and itinerary reopening regressions.
- **TypeScript passed**; `git diff --check` passed.
- **Production webpack build passed** with `node scripts/phase2-local.mjs build` (`prisma generate` then `next build --webpack`) against the isolated runtime.
- Changed code/test/script lint: **0 errors**. Full repository lint retains **21 existing errors / 35 warnings**; none was suppressed. See [logs](../artifacts/kedarkantha-acceptance/lint-full.txt).
- Default Turbopack's previously recorded local CSS-worker permission failure remains a CI/toolchain check. It was not retested here; the full webpack build was rerun after the final code changes.
- Hash checks confirm the 11 protected homepage/popup/tour/pricing/authentication files remain unchanged.

Remaining production blockers: approved additive schema installation/activation; independently reviewed real trek commercial, route, preparation and operator content; staging media upload/rights verification; release lint policy or debt resolution; a passing selected production build command in CI; staging mobile/network checks and post-release monitoring. No actual seat inventory, navigation-grade GPS trace or independent safety certification exists. Kedarkantha is intentionally not publication-ready.

## Exact safe production deployment steps — not executed

1. Review the final diff, this acceptance report and the exact SQL. Approve a concrete release candidate and target project/database separately. Resolve or explicitly approve handling of the known lint baseline; do not silently bypass it.
2. On an isolated staging database with the current production baseline, take a backup, verify restore procedures and confirm host/database/role and that sidecar tables/enum do not already exist. Do not use the acceptance fixture database as that baseline. Do not copy its rows or credentials.
3. Keep `TREK_SYSTEM_ENABLED` off and `TREK_WRITES_ENABLED=0`. Use the existing approved origin/authentication settings; no domain/DNS change is required. Leave `TREK_FIXTURE_REVIEW` unset. Run CI install, tests, TypeScript, lint and a production build. The tested fallback command is `npm run build -- --webpack`; either validate the default build in CI or explicitly review that build-command choice.
4. With the independently verified **staging** DATABASE_URL supplied securely, apply only:

   ```sh
   npx prisma db execute --schema prisma/schema.prisma --file prisma/upgrades/20261102_trek_system.sql
   npx prisma generate
   ```

   The repository uses reviewed upgrade SQL; this does not create a Prisma migrate-history entry. Do not use `db push`, reset, `migrate dev` or fixture seeding. Verify all new constraints and old tour/enquiry data.
5. Rehearse activation with `TREK_SYSTEM_ENABLED=1`, initially keeping authoring disabled. Verify homepage/popup, tour URLs/calculators, empty trek collection, sitemap/canonicals, auth, and existing enquiries. Enable authoring only after the upgrade is verified. Test real staging storage with authorized credentials, not production Blob credentials from this local runner.
6. After explicit production migration/release approval, repeat backup/identity/schema checks and the **same reviewed SQL once** against the production target, keeping activation off until schema verification. Release the approved candidate with fixture mode absent, then activate trek reads; enable authoring after smoke checks. Preserve the currently approved origin. No automatic classification/backfill is required.
7. If classifying existing tours, independently review the explicit ID/slug/type/price manifest and database fingerprint; run `scripts/phase2-backfill.mjs` in dry-run mode first. Applying it requires its separate reviewed-target approval switches. Do not convert legacy trips into treks automatically.
8. Author a fresh genuine trek draft with reviewed media, route evidence, commercial price, operator information and appropriate dates/statuses. Review preview and publication checklist. Publish only with explicit business approval. **Do not publish this acceptance draft or promote an old fixture.**
9. Verify actual public canonical URL, rendered HTML, sitemap entry, alias redirect, draft 404s, selected-departure enquiries, server totals, admin snapshots, responsive layout and tour parity. With actual authorized access, submit/monitor Search Console and analytics. Roll back authoring as described above if issues arise; retain published read routes and records.

## Screenshots

| Complete builder section | Desktop | 360px |
| --- | --- | --- |
| Overview | [View](../artifacts/kedarkantha-acceptance/builder-01-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-01-360.png) |
| Trek facts | [View](../artifacts/kedarkantha-acceptance/builder-02-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-02-360.png) |
| Route & itinerary | [View](../artifacts/kedarkantha-acceptance/builder-03-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-03-360.png) |
| Media | [View](../artifacts/kedarkantha-acceptance/builder-04-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-04-360.png) |
| Departures & pricing | [View](../artifacts/kedarkantha-acceptance/builder-05-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-05-360.png) |
| Preparation & safety | [View](../artifacts/kedarkantha-acceptance/builder-06-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-06-360.png) |
| FAQs & SEO | [View](../artifacts/kedarkantha-acceptance/builder-07-1440.png) | [View](../artifacts/kedarkantha-acceptance/builder-07-360.png) |

[Creation choice](../artifacts/kedarkantha-acceptance/create-choice-desktop.png) · [Blocked publication](../artifacts/kedarkantha-acceptance/publication-blocked-desktop.png)

| Kedarkantha detail preview | Complete page | First viewport |
| --- | --- | --- |
| Desktop | [View](../artifacts/kedarkantha-acceptance/kedarkantha-preview-1440.png) | [View](../artifacts/kedarkantha-acceptance/kedarkantha-hero-1440.png) |
| 390px | [View](../artifacts/kedarkantha-acceptance/kedarkantha-preview-390.png) | [View](../artifacts/kedarkantha-acceptance/kedarkantha-hero-390.png) |
| 360px | [View](../artifacts/kedarkantha-acceptance/kedarkantha-preview-360.png) | [View](../artifacts/kedarkantha-acceptance/kedarkantha-hero-360.png) |

[Horizontal listing at 390px](../artifacts/kedarkantha-acceptance/listing-390.png) · [360px](../artifacts/kedarkantha-acceptance/listing-360.png) · [Empty filters](../artifacts/kedarkantha-acceptance/listing-empty-360.png)
