# Phase 2 staging readiness — NO-GO

Reviewed 2 November 2026 against the current working tree, `phase2-trek-system.md` and `kedarkantha-acceptance-test.md`.

**NO-GO for migration or deployment.** The additive migration and application checks pass review, but no isolated hosted staging environment has been established. No migration, deployment, cloud environment update, production data change or DNS action was performed.

## Verified blockers and next step

| Check | Actual finding |
| --- | --- |
| Deployment target | Linked project `staylocal-v2`, `prj_nBpytWrr3c0XzBDLVxX57OCI7lBz`, scope `tapan77777s-projects`. This is the existing Production project; Preview can be used within it only with isolated Preview configuration |
| Existing staging deployment | `vercel list staylocal-v2 --environment preview --format json` returned **zero deployments** |
| Hosted configuration | `vercel env ls` lists only Production-scoped `DATABASE_URL` and `NEXTAUTH_SECRET`; no Preview variables are configured |
| Local staging file | `.env.staging` contains only DATABASE_URL and matches `.env.local` in database fingerprint, database role and password. It is a remote connection, not the disposable loopback fixture database. **Do not source it or run migration/test commands against it** |
| Production comparison | The read interface returned empty secret values for Production; actual production database/credential identity could not be established. Empty exports do not prove that deployed secrets are empty. No database connection was made to investigate |
| Staging credentials | No separate staging database role/password, authentication secret, or staging admin/editor accounts have been verified |
| Release artifact | HEAD is `7305285b76b19d758f3e656b1388b43283c46197`; Phase 1/restoration/Phase 2 are still working-tree changes. A reviewed candidate snapshot must include all intended new files. Do not push `main` merely to test staging |

**Exact next safe action:** have the database/Vercel owner provision or identify a separate staging database/branch and role, independently verify its provider identity and inability to access production, obtain the actual production database fingerprint for comparison, and prepare Preview-only credentials/settings. Recheck these read-only before seeking approval for the concrete migration and Preview deployment. A filename or a different connection-host spelling is not sufficient isolation proof.

Sanitized evidence: [environment comparison](../artifacts/phase2-staging-readiness/environment-isolation.json), [deployment target](../artifacts/phase2-staging-readiness/deployment-target.json). No credentials are in these files; the temporary secret export was removed. Existing `.env.local`, `.env.staging` and project link were not changed.

## Migration and compatibility — reviewed, not applied

Exact file: `prisma/upgrades/20261102_trek_system.sql`.

SHA-256: `804ffea17c4294d01be1b0242fe33d6c7f08c171f4359d7b508b8abeb4b20ffc`.

It matches the accepted Prisma schema diff: ProductKind plus TripClassification, TrekContent, TrekDeparture and TrekEnquiry, indexes/FKs and defensive checks. No existing scalar columns or tour/package/pricing/enquiry/user records are altered or backfilled. Existing Prisma scalar selects remain compatible before migration; default-disabled trek storage makes no new-table queries. Treks share existing Trip, TripPackage and Booking identities. Commercial pricing functions and authentication remain unchanged.

The SQL has BEGIN/COMMIT and is **one-time, not idempotent**. Foreign-key creation can briefly lock referenced tables: rehearse on the actual isolated staging baseline, verify privileges and backup/restore, and use the migration role's approved lock/statement timeout policy. Do not run `db push`, reset, `migrate dev`, fixture seeding or automatic classification. SQL execution here does not create a Prisma migrate-history entry.

Rollback retains the additive tables and enquiry history. Before real publication, disabling trek activation is possible. After publication, keep trek reads/canonical routes and suspend **trek authoring** with `TREK_WRITES_ENABLED=0`; this does not stop customer enquiries or tour administration. No safe automatic DROP/down migration is supplied. See [migration review](../artifacts/phase2-staging-readiness/migration-review.json).

## The 21 legacy lint errors

Fresh ESLint output still has **21 errors / 35 warnings**. No rules were weakened.

| Files | Errors | Release assessment |
| --- | ---: | --- |
| `components/BookingModal.tsx:49`, `components/trip/UniversalTrip.tsx:28` | 2 | Quote-loading effects are real customer paths when universal pricing is selected. These diagnostics concern synchronous loading-state updates, not demonstrated pricing/persistence failures. Abort handling exists; dependency values cover quote inputs. No infinite loop or wrong-total blocker was demonstrated. Preserve behavior |
| `components/admin/TripForm.tsx:86,200` | 4 | Tour creation slug-check loading state and three JSX-in-try/catch diagnostics on the same universal preview expression. Synchronous quote errors are caught; this is not an actual React error boundary. Existing tour functionality/tests pass. No Phase 2 runtime blocker established |
| `lib/legacy-universal.ts` | 4 | `any` typing in the legacy conversion helper, used by backfill tooling rather than the new trek runtime |
| `scripts/universal-backfill.ts` | 6 | `any` typing in an optional write-capable backfill command; it is not a deployment/build/migration step and must not run for this release |
| `staging-tests/admin.spec.ts` | 5 | `any` typing in a separately invoked test suite; no production runtime effect |

These are not all outside important paths, but none was shown to require a runtime change for this staging candidate. Next.js 16 explicitly runs lint separately from `next build`; the current Vercel build command does not invoke lint. **If the release policy requires a clean full-repository lint run, this remains an unresolved gate requiring an explicit baseline decision or a separately scoped fix.** No waiver is assumed.

One genuine staging verification blocker was fixed: the legacy wizard test expected TripForm at `/admin/trips/new`, now the package-kind chooser. It now visits `/admin/trips/new?kind=tour`. Playwright test discovery/compilation lists both suites successfully; neither remote write-capable test was run. No unrelated application refactor was made. [Exact lint locations](../artifacts/phase2-staging-readiness/lint-errors.json).

## Build configuration

Installed Next 16.4.2 documents `next build --webpack`. Vercel identifies this project as Next.js, root `.`, Node **24.x**, with its default build command. No remote webpack override currently exists. The local Turbopack CSS-worker permission error is **not evidence of a Vercel build failure**.

Prepared `vercel.staging.json`: opt-in `framework: nextjs`, `buildCommand: npm run build -- --webpack`, and staging-only `X-Robots-Tag: noindex, nofollow`. There is no default `vercel.json`; Production settings are unchanged. Use it explicitly with `--local-config` and `--target preview`. CLI read-only project inspection accepted the configuration; the webpack application build passes locally. A hosted build cannot be certified before staging is configured.

This follows [Vercel's per-deployment build configuration](https://vercel.com/docs/builds/configure-a-build) and [explicit deployment-target controls](https://vercel.com/docs/cli/deploy). It does not use static export, skip Prisma generation or alter output directories.

Fresh checks: **375 tests / 26 files pass**, TypeScript passes, isolated webpack production build passes, and `git diff --check` passes. Build used the disposable local runtime, not `.env.staging`. Logs are in `artifacts/phase2-staging-readiness/`.

## Draft and fixture inventory safety

Reviewed `lib/treks/{flags,store,enquiry}.ts`, public catalogue/JSON routes and sitemap; relevant regression tests pass. Public trek reads require published Trip + published package + explicit TREK. Draft detail/JSON is 404 and draft enquiries are rejected. Fixtures are excluded from general catalogue, legacy public JSON and sitemap; their marker cannot be stripped through the builder API. Deployed Vercel runtimes reject local fixture mode even if its flag is set. Do not copy the disposable fixture database into staging or production.

The protection has an important boundary: old scalar records cannot be identified through sidecars while the pre-migration feature is disabled. Never import published fixture rows into that fallback state or disable activation after real trek publication. Provider/database governance is still required. No claim is made about actual hosted row cleanliness without verified access.

## Commands — prepared only; blocked until isolation and approval

There is no verified staging URL, database fingerprint, production fingerprint or previous Preview ID to substitute today. The variables below are required inputs, not invented values. Never use `.env.local`, `.env.staging`, a local fixture URL or the Production deployment as a default.

### 1. Reverify target and prepare Preview-only settings

```sh
vercel project inspect staylocal-v2 --scope tapan77777s-projects
vercel env ls --scope tapan77777s-projects
vercel list staylocal-v2 --environment preview --format json --scope tapan77777s-projects
```

Required independent inputs: STAGING_DATABASE_URL, STAGING_DATABASE_ID, PRODUCTION_DATABASE_ID and a new STAGING_AUTH_SECRET. Database identity follows `lib/preview-isolation.ts`: SHA-256 of lowercase hostname, colon, port (5432 default), and `/database`; credentials/query parameters are excluded. Verify provider project/branch and role isolation too—pooler/direct aliases can identify the same underlying database despite different hashes. Confirm neither staging role nor application credentials grant production access.

After separate configuration approval, these commands write **Preview only**, never Production. They are **not executed**:

```sh
set -e
: "${STAGING_DATABASE_URL:?verified staging URL required}"
: "${STAGING_AUTH_SECRET:?new staging-only auth secret required}"
: "${STAGING_DATABASE_ID:?reviewed staging fingerprint required}"
: "${PRODUCTION_DATABASE_ID:?reviewed production fingerprint required}"
printf '%s' "$STAGING_DATABASE_URL" | vercel env add DATABASE_URL preview --sensitive --scope tapan77777s-projects
printf '%s' "$STAGING_AUTH_SECRET" | vercel env add NEXTAUTH_SECRET preview --sensitive --scope tapan77777s-projects
vercel env add PREVIEW_DATABASE_ID preview --value "$STAGING_DATABASE_ID" --no-sensitive --scope tapan77777s-projects
vercel env add PRODUCTION_DATABASE_ID preview --value "$PRODUCTION_DATABASE_ID" --no-sensitive --scope tapan77777s-projects
```

The fingerprints must be independently reviewed, distinct and nonempty. Keep TREK_FIXTURE_REVIEW absent, authoring initially off, external email/storage credentials absent or genuinely staging-only, and default universal-pricing activation unchanged. Use new staging admin/editor accounts; do not copy production password hashes or customer records.

Installed NextAuth's Vercel host detection works when NEXTAUTH_URL is unset. Do not inherit localhost or a Production authentication override. If an explicit Preview auth origin is used, verify it against the actual Preview URL. The current approved public canonical origin remains `https://staylocal-v2.vercel.app`; the opt-in staging response header prevents indexing. No domain change is required.

### 2. Gate and apply the exact migration — only after approval

Use a reviewed release snapshot. The following block fails on missing/mismatching fingerprints before the Prisma command; this is an additional check, not a substitute for provider/credential/backup verification:

```sh
set -e
: "${STAGING_DATABASE_URL:?verified staging URL required}"
: "${STAGING_DATABASE_ID:?reviewed staging fingerprint required}"
: "${PRODUCTION_DATABASE_ID:?reviewed production fingerprint required}"
export STAGING_DATABASE_ID PRODUCTION_DATABASE_ID
export DATABASE_URL="$STAGING_DATABASE_URL"
node --input-type=module -e 'import { assertPreviewIsolation } from "./lib/preview-isolation.ts"; assertPreviewIsolation({ ...process.env, VERCEL_ENV: "preview", PREVIEW_DATABASE_ID: process.env.STAGING_DATABASE_ID }); console.log("Reviewed staging fingerprint matches.")'
printf '%s  %s\n' '804ffea17c4294d01be1b0242fe33d6c7f08c171f4359d7b508b8abeb4b20ffc' 'prisma/upgrades/20261102_trek_system.sql' | shasum -a 256 --check
npx prisma db execute --schema prisma/schema.prisma --file prisma/upgrades/20261102_trek_system.sql
npx prisma generate
```

Node 24 can run this plain TypeScript helper; it does not connect to a database. Confirm the checksum above, an approved backup/restore point and that ProductKind/four sidecars are absent before execution. If already present, stop and compare schema; do not rerun. After application verify new FKs/checks and old package/customer/admin row counts. No backfill is required.

### 3. Candidate verification and explicit Preview deployment

```sh
npm test
npx tsc --noEmit
npm run lint
```

The last command currently exits nonzero for the documented baseline. Resolve the gate explicitly before proceeding; do not hide its exit status.

After migration verification and deployment approval, from the approved candidate directory:

```sh
vercel deploy --target preview --scope tapan77777s-projects --local-config vercel.staging.json \
  --build-env TREK_SYSTEM_ENABLED=1 --env TREK_SYSTEM_ENABLED=1 \
  --build-env TREK_WRITES_ENABLED=0 --env TREK_WRITES_ENABLED=0
```

Preview DATABASE_URL/secret/fingerprints must exist at build and runtime. `lib/prisma.ts` refuses Preview initialization unless its independent identities match. A pre-migration compatibility Preview can instead use system flag 0, but still requires isolated Preview credentials/identity. After read-only checks, a separately approved Preview deployment can set both authoring overrides to 1 for draft tests. **No `--prod`, promote, DNS command or Production env update is part of this procedure.**

### 4. Inspect and read-only smoke-test the returned Preview

Set STAGING_DEPLOYMENT_URL only to the actual returned deployment URL. Inspect it first and require target `preview`, project `staylocal-v2` and the reviewed scope:

```sh
vercel inspect "$STAGING_DEPLOYMENT_URL" --format json --scope tapan77777s-projects
vercel curl /api/preview-readiness --deployment "$STAGING_DEPLOYMENT_URL" --scope tapan77777s-projects -- --fail --silent --show-error
vercel curl / --deployment "$STAGING_DEPLOYMENT_URL" --scope tapan77777s-projects -- --head
vercel curl /treks --deployment "$STAGING_DEPLOYMENT_URL" --scope tapan77777s-projects -- --head
vercel curl /tours --deployment "$STAGING_DEPLOYMENT_URL" --scope tapan77777s-projects -- --head
vercel curl /sitemap.xml --deployment "$STAGING_DEPLOYMENT_URL" --scope tapan77777s-projects -- --fail --silent --show-error
```

`vercel curl` supports authorized deployment-protection access; do not disable protection to run tests. Readiness must return `environment: preview` and the reviewed staging hash, not 404/503. Public routes must have noindex headers, expected content/status and no runtime exceptions.

### 5. Staging verification checklist

- `/`: restored hero video/effects, Founder Story, enquiry entry point and direct Treks/Tours links; welcome popup once per browser session, dismissible.
- `/treks`: honest empty collection when no real trek is published; horizontal image-left cards for reviewed data, filters/reset/empty state, no popup, 360/390px no overflow.
- `/tours` and existing `/trip/[slug]`: existing package labels, durations, price matrices, group calculations and protected Andaman behavior match the approved baseline. Include published Kashmir.
- Admin: separate admin/editor login; create-kind chooser; existing Tour Builder; all seven Trek Builder sections, drafts, stale-edit validation and authenticated preview; preview enquiries disabled. A fresh unpriced, unreviewed editorial draft is sufficient—do not import/promote loopback fixtures or publish test inventory.
- Draft privacy: public detail/JSON 404, absent from listings/sitemap, unauthorized preview redirects, direct Booking POST rejected with no row. Inspect sitemap/raw inventory for any accidentally imported fixtures.
- Enquiries: after explicit staging-write approval, use a labelled staging enquiry on a reviewed existing tour, verify server total, package ownership and admin record. Confirm no production storage/notification destination is used. Test departure pricing only if genuine, reviewed staging data is available; do not invent confirmed inventory to populate the page.
- SEO/performance: server-rendered content, current canonical origin, staged noindex headers, correct sitemap/robots, draft noindex/404 and no fake offers/ratings. Check images/alt text, keyboard behavior, mobile sticky action and throttled loading.

The old `staging-tests/admin.spec.ts` suite is **not** a read-only Phase 2 smoke test: it requires additional universal-pricing activation and separate credentials, publishes/deletes its fixtures and writes bookings. It must not be run just because `--list` passes. The loopback acceptance scripts also must not be redirected to hosted staging.

### 6. Rollback/containment commands

No existing Preview deployment is available to name as a rollback target. Do not invent an ID or run project-wide `vercel rollback` on this Production-linked project.

For an approved containment build, retain the same verified Preview data/settings and current read routes, redeploy the approved candidate with authoring 0 (the exact deployment command above). This produces a new immutable URL; **it does not disable writes through an older Preview URL**. Switch reviewers to the approved URL and retire the failed Preview only after confirming its identity:

```sh
vercel inspect "$FAILED_STAGING_DEPLOYMENT_ID" --format json --scope tapan77777s-projects
vercel remove "$FAILED_STAGING_DEPLOYMENT_ID" --safe --scope tapan77777s-projects
```

The ID must be an exact independently checked Preview deployment ID, never the project name or Production ID. `--safe` refuses aliased deployments; if skipped, stop for explicit alias/access retirement review rather than claiming containment. Removal changes deployment access, not database rows. Preserve sidecar data/snapshots. Do not drop tables or automatically restore a backup. A data restore or removal of an aliased deployment requires a separate concrete recovery approval.
