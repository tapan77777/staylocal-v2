# Production readiness remediation

Local candidate review, 21 October 2026. **NO-GO for production promotion.**
Supersedes dependency counts in the original [review](production-readiness-review.md),
not its confirmed production credential finding. No account, production record,
secret, remote resource, deployment or repository remote was changed in this task.

## Local changes

| Files | Result |
| --- | --- |
| `package.json`, `package-lock.json` | Next 16.2.6 → 16.4.2, matching eslint-config-next; NextAuth 4.24.14 → 4.24.15, pinned. Compatible transitive fixes via `npm audit fix`, without force. React and Prisma majors unchanged. |
| `lib/preview-isolation.ts`, `lib/prisma.ts` | Preview refuses database client initialization unless the configured database identity matches an independently approved Preview identity and differs from the production identity. No production/local behavior change. |
| `app/api/preview-readiness/route.ts` | Uncached, read-only Preview identity preflight, no credentials/URL, no database query. Returns 404 outside Preview and 503 for unsafe configuration. |
| `scripts/reset-admin-password.mjs` | Refuses reuse of the current password; explicitly warns that old deployments can retain sessions. Existing offline hidden-input mechanism remains operator-only. Not executed. |
| `__tests__/preview-isolation.test.ts`, `__tests__/session-rotation.test.ts` | Isolation failures and real NextAuth encrypted-cookie key rotation tests using ephemeral synthetic keys. |
| `playwright.staging.config.ts`, `staging-tests/admin.spec.ts` | Authenticated staging workflow, explicit target/write opt-in and database preflight before credentials. No saved session, trace, screenshot or video. |
| Review documents | Historical review retained and linked to this remediation/runbook. |

Public rendering, homepage design, pricing logic, trip slugs, Prisma schema and
database records were not edited. Existing `admin` and `editor` roles still use
the same User rows/bcrypt format; no account migration or reset is automatic.

## Dependency decision and exposure

Registry peer metadata accepts Next 16.4.2 with React 19 and NextAuth 4.24.15;
eslint-config-next 16.4.2 accepts ESLint 9. No NextAuth v5 or other major upgrade.

- Next 16.4.2 exceeds the patched versions for the reviewed
  [AVIF optimizer RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
  and [next/og RCE](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
  The app has no `next/image`/`ImageResponse` use; authenticated uploads reject
  AVIF. This reduces demonstrated feature exposure; it is not a substitute for patching.
- NextAuth 4.24.15 patches the reviewed
  [malformed Bearer exception](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-xmf8-cvqr-rfgj),
  [email normalization issue](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-7rqj-j65f-68wh)
  and [OAuth cookie binding issue](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279).
  Current app uses Credentials only, without `getToken`, email or OAuth providers.
- Full audit: **5 high, 0 critical, 0 moderate, 0 low**, reduced from 17 findings
  (2 critical). All five ratings are one dependency chain:
  `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
  [braces nested-pattern stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  has no published patched version; registry latest is 3.0.3. It is development
  tooling, not imported by app request handlers. Untrusted lint/glob input could
  still crash tooling. Run untrusted PR checks without secrets and with time limits.
  Do not run npm's force suggestion (ESLint config downgrade to 14.2.35).
- `npm audit --omit=dev`: **0 findings**. This is advisory coverage, not a proof of
  absence of vulnerabilities. Keep the tooling advisory as an explicit release
  exception requiring owner acceptance or wait for a compatible upstream fix.

Audit JSON is local at `/tmp/staylocal-remediation-audit.json` and
`/tmp/staylocal-remediation-runtime-audit.json`. Re-audit the exact lockfile in CI.

## Password rotation preparation — not performed

The original review confirmed one production admin matches a historical fixed
seed credential. Removing the seed constant does not remediate that account.
Treat the previous value and history as compromised; do not quote them or use them
to sign in. This finding does not establish whether unauthorized access occurred.

Before account mutation obtain explicit approval identifying the target account,
production database, maintenance window and operator. The operator must:

1. Use a trusted terminal without session recording, shell tracing or debug logs.
   Confirm the securely loaded DATABASE_URL targets production without displaying
   it. Review the reset script and the target's staff role using read-only checks.
2. Create a unique password in a password manager (prefer 32+ random ASCII
   characters, at least 16 and at most 72 UTF-8 bytes). Do not put it in chat,
   command arguments, shell environment assignments, source, screenshots or logs.
3. Only during the contained rollout below, run the offline command. Substitute
   only the account identifier and a trusted private environment file path:

   ```sh
   node --env-file=/secure/operator-production.env scripts/reset-admin-password.mjs --email ACCOUNT --confirm-reset --allow-remote-reset
   ```

   The command is prepared, NOT approved or executed. Input and confirmation are
   hidden, TTY required; no piped input/password argument. It updates only the
   eligible user's password via compare-and-update and rejects reuse. It does
   not alter role, other accounts, trips or bookings. Keep the password only in
   the password manager. Do not copy private env files into the repository.
4. Confirm only success/failure and account identity through a secure channel.
   Verify fresh login after rollout; never print database verifiers.

## Coordinated containment and session revocation

Password-tag revalidation in new `lib/auth.ts` rejects old untagged JWTs, changed
passwords, removed accounts and current role changes on each authenticated request.
New JWT lifetime is eight hours. This protection cannot execute in old artifacts.
Resetting a password alone does NOT revoke old deployed JWTs. Merely changing an
environment setting also leaves old deployment snapshots unchanged; see
[Vercel environment variable deployment scope](https://vercel.com/docs/environment-variables).

Required order, each remote/mutation action subject to explicit approval:

1. Finish isolated staging validation and prepare a security-safe fallback build
   first. If urgent containment is approved earlier, keep access blocked until
   these gates pass; do not reopen a vulnerable admin while waiting for UI tests.
2. Inventory canonical domain, branch aliases, custom domains and ALL old direct
   deployment URLs that can reach production DB/auth. Confirm available Vercel
   plan protection/firewall controls before starting. Do not assume a firewall
   rule on the canonical alias also covers deployment URLs.
3. Apply and verify containment on every vulnerable deployment. Prefer complete
   deployment protection/denial or approved retirement of old artifacts. At a
   minimum block `/admin` and descendants, `/api/auth` and descendants,
   `/api/admin` and descendants, protected enquiry `GET /api/bookings`, and all
   other sensitive paths found in that deployed artifact. Old code can have
   missing authorization, so blocking only the login page is insufficient.
   Full denial avoids omissions. If coverage cannot be verified, remain NO-GO.
4. Confirm already-running authenticated requests have drained before mutation.
   While containment remains active, perform the approved offline password reset.
   Independently rotate production NEXTAUTH_SECRET to a new cryptographically
   random secret using the secret manager/Vercel sensitive input. Do not expose
   it, reuse Preview's secret, accept the old key as fallback or change accounts'
   roles. This intentionally signs everyone out. No secrets generated here.
5. Build/deploy the reviewed patched candidate with the NEW secret, correct
   production DB and canonical NEXTAUTH_URL, under containment. New env applies
   to the new deployment. No production migration or seed command is needed.
6. Verify old cookie rejection on the candidate and fresh approved login. For a
   real old session, use an owner's existing cookie held only in memory; do not
   mint a production session or log/copy cookies. Check `/api/auth/session`
   exposes no authenticated user and sensitive APIs reject it. If no existing
   cookie is available, rely on the tested cryptographic property plus deployed
   key/configuration evidence; record that production replay was not exercised.
7. Keep ALL old vulnerable artifacts protected or retire them with approval.
   Changing alias targets is insufficient: direct URLs may still accept old JWTs
   under their old key and query production. New key rejection is guaranteed only
   on deployments using the new key. Do not claim global revocation until old
   deployment reachability is denied and independently checked.
8. Promote the verified new deployment, check each public/alternate entry point,
   then lift containment only for the secure deployment. Old endpoints stay
   denied. Watch sanitized auth errors/5xx; no request bodies/cookies in logs.

Local `session-rotation.test.ts` deliberately proves an old cookie still decodes
with its old key and fails with the new key. Auth tests prove tag-based invalidation.
Clearing browser cookies, signing out one browser or waiting for the new eight-hour
expiry does not solve old deployments' sessions. If old URLs cannot be protected,
approved production DB credential rotation/retiring their DB role may be needed
to cut off their database access; this is additional infrastructure work, not done.

## Isolated Preview configuration and staging execution

No Preview resources were provisioned or settings modified. The prior review
found no Preview variables. An operator must approve and verify:

| Setting/resource | Preview requirement |
| --- | --- |
| PostgreSQL | Separate empty database/project and dedicated role, with NO grants/network access to production; no production branch that can merge writes back. |
| `DATABASE_URL` | Preview-only connection to that database, never a production fallback. Verify host/database and role grants independently. |
| `PREVIEW_DATABASE_ID` | SHA-256 identity of the approved Preview URL's host:port/database path. |
| `PRODUCTION_DATABASE_ID` | Corresponding identity of production; non-secret deny marker. Never copy its URL into Preview. |
| `NEXTAUTH_SECRET` | Separate random Preview-only secret, configured securely. |
| `NEXTAUTH_URL` | Exact isolated staging HTTPS origin, matching the test target. |
| `NEXT_PUBLIC_SITE_URL` | Same staging origin if configured; never production for write tests. |
| `VERCEL_ENV` | Vercel-provided `preview`; do not override to bypass isolation. |
| Blob | Optional. Omit token for URL-only images. If upload testing is approved use a SEPARATE Preview store/token, never production's. |
| Access protection | Restrict staging to operators. Test runner needs approved access; no bypass token is written into this repo. |

Compute database identities locally from securely loaded env, without connecting:

```sh
node --env-file=/secure/database.env --input-type=module -e 'import { databaseIdentity } from "./lib/preview-isolation.ts"; console.log(databaseIdentity(process.env.DATABASE_URL))'
```

Use Node 24 (matching Vercel). Output is a non-secret digest, not a password hash.
Host aliases, pooler endpoints and database aliases can represent the same physical
database: hashes are an accidental-misconfiguration check, NOT proof of isolation.
Verify provisioned resource IDs and database grants independently and use the exact
runtime connection identity. A wrong production deny marker defeats that check.
Preview deliberately fails to build/start with missing identities; this is a safety gate.

After approval only: initialize the schema on the EMPTY isolated DB (review
`prisma db push --skip-generate` against the explicitly selected Preview connection;
never add it to install/build), create dedicated synthetic admin/editor accounts
with password-manager credentials through a reviewed offline operator procedure,
and load synthetic trips. The guarded development seed intentionally refuses
remote databases; do not weaken it. Do not copy production Users, passwords,
sessions, customer contacts or bookings. Optional public trip fixtures require a
reviewed sanitized export; Andaman/Jibhi/Darjeeling legacy fields must remain exact.

The runner requires these securely supplied local/CI variables (no defaults):
`STAGING_BASE_URL`, `STAGING_APPROVED_HOST`, `STAGING_DATABASE_ID`,
`STAGING_ALLOW_WRITES=yes`, `STAGING_ADMIN_EMAIL`, `STAGING_ADMIN_PASSWORD`,
`STAGING_EDITOR_EMAIL`, `STAGING_EDITOR_PASSWORD`.
Use a private CI secret scope or private env file, never inline credential commands.
No DEBUG/PWDEBUG/protocol logs, traces or screenshots while credentials are entered.

```sh
npx playwright test --config=playwright.staging.config.ts
```

No remote staging test was run here. `--list` validates test discovery without
credentials, network calls or writes. The test refuses canonical production, HTTPS
origin mismatches and preflight redirects; requires Preview's independently
expected database identity BEFORE submitting credentials. Do not set the opt-in
against production or any deployment with a production DB.

Prepared coverage: browser login for both roles, wizard step persistence;
anonymous denial and editor booking/deletion denial; draft creation/hidden public
page; editing; stale version conflict; negative pricing; cross-trip package IDs;
package update and publish with itinerary; public page; synthetic enquiry;
invalid/allowed/forbidden booking transitions; unpublish; explicit package deletion;
incomplete publish refusal. Fixture trips are deleted by their returned IDs and
unique run slugs. A cancelled synthetic enquiry is retained (no booking deletion
API); remove through an approved isolated DB cleanup or discard the Preview DB.
These are real integration tests awaiting execution, not evidence of passing staging.
Also manually verify mobile builder, upload/URL fallback, production-data-shaped
legacy fixtures and customer enquiry/WhatsApp UI without sending real messages.

## Secure rollback and release gates

Verification on the final local candidate:

| Check | Result |
| --- | --- |
| `npm test` | 274 tests passed, 13 files. Includes existing security, validation, builder and legacy preservation suites plus new isolation/JWT tests. |
| `npx tsc --noEmit` | Passed, including staging test sources. |
| `npm run build` (Turbopack) | Attempted; sandbox font download initially failed, then approved retries failed because the CSS worker could not bind a local IPC port (`Operation not permitted`). No CSS/design changes made to bypass it. Normal build remains an external verification gate. |
| `npm run build -- --webpack` | Passed: production compilation, TypeScript, prerendering and traces. Supported alternative builder, not proof that default Turbopack passes. Build script unchanged. |
| `npx playwright test --config=playwright.staging.config.ts --list` | Passed discovery; remote authenticated staging execution pending configuration/approval. |
| `node --check scripts/reset-admin-password.mjs` | Passed syntax only; reset never executed. |
| `git diff --check` | Passed. Redacted current-file scan of 67 changed/untracked paths found no private key, live bcrypt verifier or Blob token patterns. No env files or new destructive migrations included. Inert test fixtures remain identified as tests. |
| Dependency audits | Full: five high tooling ratings; production-only: zero findings. |

Build warns about an unrelated parent directory lockfile; it remains outside the
Git repository. Reproduce a clean `npm ci`, full tests, typecheck and default
`npm run build` on Node 24 in CI/isolated Preview before approval to promote.
No new live production browser/authentication test or database-content comparison
was performed in this remediation; original review preservation evidence remains
historical. Recheck approved sanitized legacy fixtures in staging.

Do not roll back to the captured pre-Phase-1 deployment or its environment snapshot.
Before promotion prepare a second tested patched build with the same role gates,
credential-tag validation, ownership/input checks, patched dependency lockfile and
NEW production secret. If reverting a UI regression, preserve current API payload
metadata/version checks; the old form is not automatically compatible with them.
Prefer fixing forward or temporarily blocking admin writes to reopening old auth.
No migration is introduced, so rollback requires no data restore. Keep the rotated
User password and secret; never restore User credentials from a database backup.

On rollback: re-enable containment if needed, deploy/repoint only to the verified
security-safe fallback using the current key, replay old-cookie/role checks,
check public pages, then reopen secure access. A prebuilt Preview artifact uses
Preview DB/secret and must NEVER be promoted unchanged as a production fallback.
If no safe fallback exists, remain under containment and fix forward.

Post-deployment read checks: homepage cards and `/trip/andaman`, `/trip/jibhi`,
`/trip/darjeeling`; API images/prices/itinerary; nonexistent slug 404; anonymous
admin/API denial; old session denial; fresh approved admin login; roles preserved;
old deployment URLs inaccessible; Preview preflight 404 in production; no new 5xx.
Content mutation smoke tests belong in isolated staging. Any production fixture
creation, upload, booking or reset still needs explicit approval.

Approval gates remaining:

1. Provision isolated database/role, initialize only its schema, create synthetic
   staff accounts, configure Preview-only variables/protection and deploy Preview;
   run staging writes and cleanup. Optional separate Blob resources only if wanted.
   Verify the default production build there, since local Turbopack was blocked.
2. Accept the five development-only advisory ratings temporarily, with isolation
   controls, or wait for an upstream patch. No known audited runtime finding remains.
3. Approve a coordinated window: contain all vulnerable production deployments,
   reset the named account, rotate NEXTAUTH_SECRET, deploy patched production and
   security-safe fallback, retire/protect old artifacts, verify and reopen access.
   Database credential rotation is separately approved only if containment needs it.
4. Approve push/deployment separately; no such action is authorized by this report.

The known production credential remains unchanged and isolated staging has not
run. Those are unresolved blockers; local green checks alone do not change NO-GO.

Other residual auth limitations: throttling is per process and resets on cold
starts; distributed rate limiting/WAF controls and MFA need separate infrastructure
or product approval. Recovery remains the trusted offline tool, with no public
password-reset service. JWT validation reads the database each time and fails
closed on outages. No approval for adding a remote session store was assumed.
