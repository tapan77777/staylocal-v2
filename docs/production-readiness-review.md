# Production readiness review — 21 October 2026 (IST)

Follow-up: see [production-readiness-remediation.md](production-readiness-remediation.md)
for local dependency patches, Preview isolation and the coordinated rotation plan.
The findings below record the original review; production remediation remains pending approval.

**Decision: NO-GO for the current release.** Functional checks pass, but an active
historical seed credential and unresolved dependency advisories prevent security
sign-off. Isolated authenticated staging validation and a security-safe rollback
target are also still required.

This review made no application-code changes, production writes, credential
resets, migrations, deployments, pushes, or Blob resources. The only repository
addition from this review is this report. Database operations were SELECTs;
public/local smoke requests were GETs. Production write flows were not exercised.

## Release blockers and approvals needed

| Priority | Finding | Required action, not performed |
| --- | --- | --- |
| P0 | The one production admin account still verifies against the historical fixed seed credential. | Approve immediate coordinated password rotation and session containment/revocation. Removing the seed constant does not update the account or revoke old JWTs. |
| P1 | Installed Next.js 16.2.6 and NextAuth 4.24.14 are in affected dependency ranges. Audit reports 17 vulnerable package groups, including 2 rated critical. | Approve a focused dependency patch and fresh compatibility/security verification, or a documented security exception with evidence. Do not use an indiscriminate force upgrade. |
| Release gate | No Vercel Preview environment variables are configured. No real authenticated write workflow has been run against a disposable database. | Approve/configure an isolated preview database and separate auth secret; complete the staging checklist below. Never point write tests at production. |
| Release gate | The captured current deployment predates the new session protections. A naive rollback can restore old authentication behaviour and signing configuration. | Prepare and verify a patched fallback retaining credential/session fixes before production promotion. |

The credential check extracted the historical seed value internally from Git and
compared it with database verifiers in memory using bcrypt. It printed only match
counts: one matching account, role admin. No password, hash, token, account email,
or login request was exposed or submitted. This is a confirmed credential-reuse
finding, not a claim that an attacker has accessed the account. It warrants
containment independently of the Trip Builder release.

## Diff, secrets, scope, and migration review

Reviewed the 24 tracked modified files and 34 untracked files present when the
review began, including the new policies, API handlers, tests, upload integration,
styles, documentation, five PNG screenshots, and dependency lockfile.

- No newly added live secret literals, private keys, credential-bearing connection
  URLs, real bcrypt hashes, or environment files were found by redacted scans and
  source review. `.env*`, `.vercel`, `.next`, and build caches remain excluded.
- Tests do contain deliberately inert password/verifier/token strings and
  example identities. Those are mock fixtures, not deployable account defaults.
  Screenshots contain a synthetic preview operator, not production customer data.
- The old seed credential is removed from the working source, but remains in Git
  history and, critically, is still valid for the production admin account. A clean
  new-source scan does not erase that risk. Do not distribute credential-bearing
  historical patches as if the credential had already been rotated.
- No Prisma schema, migration, or upgrade SQL change is in this uncommitted set.
  The already tracked package-schema upgrade is additive and is not invoked by
  install/build. Production already has TripPackage and the three Booking package
  columns. No production migration is required for this candidate.
- `build` remains `prisma generate && next build`; `postinstall` only generates
  the client. Neither seed nor reset tooling is invoked automatically.
- Homepage, global public CSS, public trip rendering components, TripCard,
  AndamanPage, and public pricing functions have no diff. The shared bookings
  route changes its protected GET authorization, not the public enquiry POST logic.
- Package additions are Zod, Vercel Blob, direct Sharp, and development test tools.
  Existing package changes are related Sharp/native runtime dependencies and Zod;
  Next.js, NextAuth, React, and Prisma versions were not silently upgraded.
  Download URLs in the lockfile use registry.npmjs.org.
- The admin UI/API changes match the requested Phase 1 and builder scope. Changes
  to editor visibility and Save Draft/unpublish behaviour are deliberate and
  guarded, not accidental public-site changes.

The working tree remains uncommitted. Source must be explicitly reviewed/staged,
including new untracked files, when a release is later authorized.

## Production account and role compatibility

Read-only database checks found one user: role **admin**. Aggregate format checks
found one bcrypt-compatible verifier. The current account is eligible for the
new Credentials provider and retains administrator permissions. No new account,
role conversion, or reset is technically required for compatibility; rotation is
required for security because of the confirmed seed-credential reuse.

Editors retain content creation/editing/publication and package management.
Customer enquiries, booking status changes, the users list, and whole-trip
deletion require admin. There are no production editors to migrate; hypothetical
editor restrictions are covered by automated tests.

Old JWTs lack the new verifier-derived tag and require a fresh sign-in after
rollout. Password changes then invalidate tagged sessions on their next session
evaluation; roles are refreshed from the DB. The old currently deployed code
does not provide that password-change revocation guarantee. Resetting a password
alone on the old deployment must not be treated as complete session containment.
Any signing-secret rotation or account reset requires explicit approval.

## Content preservation and functional evidence

Compared 22 trip fields against the prior pre-builder database snapshot: slug,
title, subtitle, location, category, duration, difficulty, price, status, image,
gallery, route, highlights, included/notIncluded, FAQs, type, pricing, itinerary,
tierDetails, durLabels, and durSubLabels. All matched exactly.

| Trip | Slug | Stored card/base price | Packages | Result |
| --- | --- | --- | --- | --- |
| Andaman | andaman | ₹18,999 | 0 | Published; dedicated type and special pricing unchanged |
| Jibhi | jibhi | ₹15,000 | 0 | Published; calculator, pricing matrix and legacy itinerary unchanged |
| Darjeeling | darjeeling | ₹5,999 | 0 | Published; legacy fields and existing gaps unchanged |

Darjeeling still has an empty itinerary, blank duration summary, and a first
legacy calculator price of ₹4,999 versus the stored ₹5,999 card price. These are
existing content issues, not release-induced changes; no values were invented.
Andaman's hardcoded itinerary and special calculator remain protected.

Additional checks:

- Both production and the locally running candidate build returned 200 for all
  three published pages and APIs. The homepage card links, hero images, stored
  calculator prices, available initial itinerary, and WhatsApp links passed the
  existing read-only smoke script. Missing page/API trips returned 404.
- Six in-memory dry runs used freshly captured production trip records with the
  actual new PUT handler: draft and published saves for each trip. All returned
  200; all non-status fields were preserved exactly, and no package mutation was
  attempted. Prisma/session boundaries were mocked, so no database write occurred.
- Automated UI tests cover creation, title/slug editing, wizard navigation,
  draft saving, publication confirmation, complete package/day editing,
  reordering, deletion confirmation/undo, failed saves, and legacy preservation.
- API tests cover roles, anonymous access, malformed input, package ownership,
  stale versions, confirmed removals, publication readiness, Andaman protection,
  and safe errors. Actual row locks/transactions against PostgreSQL still need
  the isolated staging exercise.
- The compiled candidate denied anonymous GET access to bookings, media config,
  and slug checking with 401. `/admin` redirected to login; login returned 200.
  Its authentication provider list contained Credentials only.
- The prior isolated Chrome review checked all five steps at desktop/mobile
  widths without overflow or runtime errors; screenshots remain in
  `artifacts/trip-builder`. This is not a real production login/write test.

## Dependency advisory assessment

Fresh `npm audit`: **17 package groups — 2 critical, 12 high, 2 moderate, 1 low**.
No dependency was changed during this review.

- **Next.js 16.2.6:** affected by multiple advisories. Maintainer advisories include
  [AVIF image optimization RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
  and [next/og ImageResponse RCE](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
  These have feature-specific prerequisites; no application use of ImageResponse
  or next/image was found. The proxy advisory additionally requires a single
  configured locale, absent here, and page/API authorization is independently
  enforced. This review did not demonstrate exploitability. Nevertheless, an
  affected framework cannot receive unconditional release sign-off without
  patching or an explicit applicability-based exception. Audit proposes 16.4.2;
  pair any upgrade with matching eslint-config-next and renewed tests.
- **NextAuth 4.24.14:** audit assigns a critical package rating. The maintainer's
  [email-normalization advisory](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-7rqj-j65f-68wh)
  is rated High and concerns email/magic-link authentication, which is not enabled.
  The [getToken advisory](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-xmf8-cvqr-rfgj)
  concerns direct calls not present in this app; the
  [OAuth advisory](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279)
  concerns flows not configured here. Do not misreport these as a demonstrated
  Credentials-provider exploit. Upgrade within v4 to at least the maintainer's
  patched 4.24.15, then re-audit rather than relying only on the package rating.
- The vulnerable Sharp path is Next's nested older Sharp. The new direct upload
  dependency is 0.35.5. Fixing only direct Sharp does not clear the nested finding.
- Other findings include PostCSS and lint/build dependencies. Reassess them after
  the focused framework/auth patch. Avoid the suggested unrelated major downgrade
  of eslint-config-next or a blanket `npm audit fix --force`.

## Vercel configuration

Read-only project inspection confirmed Next.js preset, root `.`, Node **24.x**,
and the default build command (`npm run build` / Next default). Native upload
dependencies support this Node version.

| Setting | Verified state | Release requirement |
| --- | --- | --- |
| DATABASE_URL | Present, encrypted, Production scope | Preserve existing value; do not retarget production or print it |
| NEXTAUTH_SECRET | Present, encrypted, Production scope | Preserve unless coordinated revocation/rotation is explicitly approved |
| NEXTAUTH_URL | Not listed | Recommend canonical `https://staylocal-v2.vercel.app`; verify auth origin/cookies in staging. Vercel auto-detection is currently relied upon |
| NEXT_PUBLIC_SITE_URL | Not listed | Optional; existing code has the correct production-domain fallback |
| BLOB_READ_WRITE_TOKEN | Not listed | **Optional, not a deployment blocker.** URL photos work; upload remains disabled/unavailable |
| Preview environment variables | None listed | Configure isolated DB and separate auth secret before authenticated staging tests |

No Blob store or token was created. If later approved, use a public Blob store
and a server-only token, with separate preview/production resources. Never expose
it using a NEXT_PUBLIC variable. With no token, the build/public pages/builder
URL-photo flow work; authenticated upload reports 503 and the UI explains why.

Login throttling is per process only. Distributed limits require an approved WAF
rule or shared atomic store. There is no MFA or self-service email recovery.
These limitations must be accepted explicitly or scheduled for follow-up; no
external infrastructure was provisioned here.

## Verification results

| Check | Result |
| --- | --- |
| Complete `npm test` | **262 passed, 11 files** |
| `npx tsc --noEmit` | Passed |
| `npm run build` | Passed |
| `git diff --check` | Passed |
| Production public-trip smoke | Passed for all 3 pages/APIs, links/content, and 404s |
| Local candidate public-trip smoke | Passed for the same checks |
| Candidate anonymous admin checks | Passed: login/redirect and 401 guards |
| Real-record handler dry runs | 6 passed; no actual database writes |
| Production schema compatibility | TripPackage and Booking package columns already present |
| Fresh dependency audit | Unresolved findings; security gate failed |
| Real authenticated staging writes | Not performed; preview not configured |

The build still emits the existing multiple-lockfile workspace-root warning.
There are also four extraneous local optional WASM packages in node_modules;
they are not source changes. A clean `npm ci` on isolated CI/Preview is required
before final release sign-off rather than treating this local install as proof
of a fresh Linux/Vercel deployment.

## Deployment steps — only after separate approval

1. Resolve credential reuse and session containment first under an approved plan.
   Consider temporary restriction of admin access while coordinating the reset,
   signing/session changes, and secure deployments. Do not run a reset or rotate
   NEXTAUTH_SECRET as an unapproved routine release step.
2. Apply the approved dependency patch; re-audit, rerun tests/typecheck/build,
   and review the refreshed diff/lockfile. Resolve or explicitly accept every
   relevant remaining advisory.
3. Configure isolated Preview data/auth settings and run a clean install/build.
   Use a reviewed schema setup for that disposable database, not production.
   Establish separate test staff credentials without placing them in source.
4. Run the complete authenticated staging checklist below. Decide whether to ship
   with URL-only photos; Blob can be enabled separately. Prepare and record a
   security-fixed fallback deployment before promoting the builder.
5. Review/stage all intended source and lockfile additions. Create the approved
   release commit, record its SHA, and obtain deployment approval. No commit,
   push, or deployment is implied by this readiness report.
6. Confirm a recoverable content backup/point-in-time recovery and record active
   production deployment/configuration metadata. No new production migration,
   seed, or reset script belongs in the build pipeline.
7. Deploy/promote only the approved artifact using the existing Vercel workflow.
   Prefer a coordinated, separately approved security-only production release
   first, then the builder release, so the previous production target is already
   security-fixed (especially important on Hobby). Expect one fresh sign-in for
   staff. Keep a short content-edit freeze while read-only smoke tests and log
   checks run.
8. Enable optional Blob only after a separate resource/configuration decision;
   enabling it later requires testing but does not require a data migration.

## Rollback plan

Captured current production reference: `dpl_8PJzuhzeKCQR2fWT8VFaoGuWWp3q`, READY,
URL `staylocal-v2-glvvxcgtv-tapan77777s-projects.vercel.app`. Its inspection did not
provide a Git commit SHA, so source-to-artifact identity is not asserted.

**This reference is not a pre-approved security-safe rollback target.** It predates
the new session protections and currently accepts the known historical credential.
After a signing-secret rotation, re-promoting an older deployment can also bring
back its older signing configuration: environment changes apply only to newly
created deployments, not existing ones. See
[Vercel environment-variable behaviour](https://vercel.com/docs/environment-variables).

Before rollout, build/test a fallback that retains the patched dependencies,
Phase 1 authorization/session protections, and current approved secret, while
reverting only the builder UI if needed. Record its deployment ID and verify it
is a permitted rollback target for the project's plan. Vercel supports
`vercel rollback [deployment-id or url]`, but Hobby limits target selection to
the previous production deployment; see the
[official rollback reference](https://vercel.com/docs/cli/rollback).

On failure: pause content edits, assess whether a fix-forward or approved secure
fallback is safer, then switch traffic only with approval. Verify public routes,
auth guards, new credentials, old-session rejection, and logs immediately.
No database rollback is required for this code-only release. A code rollback
does not undo later content edits or Blob uploads. Never restore an old User
password or signing secret from a backup as part of a UI rollback. Any actual
content restore must be separately reviewed and preserve security changes.

## Staging and post-deployment smoke checklist

Read-only production checks may run after an approved deployment. All write tests
belong in the isolated staging database; production test records or enquiries
require their own explicit authorization.

- [ ] Homepage and all published card links load; `/trip/andaman`, `/trip/jibhi`,
  `/trip/darjeeling` and their public APIs return 200 with unchanged images,
  itinerary, prices, slugs, and legacy values. Missing trips return genuine 404.
- [ ] Anonymous admin navigation redirects; protected read APIs return 401;
  unauthorized write tests in staging return 401 without any mutation.
- [ ] Approved staff can sign in with their current post-containment credentials;
  no credential or token appears in logs. Old JWTs are denied. Confirm canonical
  origin, secure-cookie persistence, sign-out, and fresh sign-in.
- [ ] Staging editor can manage content but cannot read bookings/users or delete
  whole trips (403). Staging admin retains those permissions.
- [ ] Create a disposable staging trip, navigate all five steps/backwards, edit its
  generated slug, test a collision, and save/reopen a draft with values intact.
- [ ] Add/reorder packages and days, set prices/POR, keep a package draft, verify
  draft packages are absent from public output, and confirm/undo a saved removal.
- [ ] Attempt invalid publication: missing cover/package/day details must fail.
  Review/confirm valid publication, verify public detail output, then confirm
  unpublishing the staging record. Do not unpublish the real three trips.
- [ ] Open two staging edit tabs: after one saves, the other's stale write returns
  409 and retains local input. Missing removal confirmation cannot delete packages.
- [ ] Capture legacy fields before/after staging edits to all three cloned trips;
  exact values remain. Andaman package/pricing changes are blocked.
- [ ] Without Blob, URL photos/preview/reordering work and upload is disabled or
  reports the documented configuration message. If Blob is later approved, test
  valid uploads, MIME mismatch, SVG, oversized input, and unauthorized requests
  against its separate preview store.
- [ ] Exercise allowed/invalid booking transitions and concurrent updates on
  staging fixtures; errors are visible and private details are not leaked.
- [ ] Check mobile keyboard/focus/ordering, no overflow, navigation warnings, and
  error/loading recovery. Confirm API calls preserve the public host Origin.
- [ ] Check Vercel runtime logs for 500s, auth/session errors, Prisma failures, and
  unexpected transaction conflicts. Lift the edit freeze only after sign-off.

## Approval summary

The requested decision is **NO-GO, not a failed functional build**. Approval is
needed for credential/session remediation, targeted dependency updates, isolated
Preview setup/write validation, and a verified security-safe rollback artifact.
Blob provisioning is optional and is not one of the release blockers.
