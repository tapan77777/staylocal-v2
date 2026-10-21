# Phase 1: Admin security and reliability

Implemented locally only. No deployment, schema migration, production writes,
credential reset, or account changes were performed. The homepage, public trip
components, styles, and database schema were not changed.

## Permissions

All admin API handlers use `adminAccess`, which calls
`getServerSession(authOptions)`. Anonymous/revoked sessions receive 401;
insufficient roles receive 403. Browser writes with a different Origin are denied.
Database failures produce generic errors rather than Prisma exception details.

| Operation | Editor | Admin |
| --- | --- | --- |
| Read/create/edit/publish/unpublish trips | Yes | Yes |
| Manage packages on their parent trip | Yes | Yes |
| List/create experiences | Yes | Yes |
| Delete an entire trip | No | Yes |
| Read customer enquiries or change their status | No | Yes |
| Read the users list | No | Yes |

The booking read endpoint `/api/bookings` is covered as well as `/api/admin/**`.
Server-rendered pages enforce the same permissions. Editors' dashboard queries
do not load booking information, and admin-only navigation is hidden from them.
The user list explicitly selects display fields rather than password hashes.
No new trip deletion UI or dashboard redesign was introduced.

## Booking changes

Only `pending`, `confirmed`, and `cancelled` are recognized. The existing workflow
allows pending → confirmed/cancelled and confirmed ↔ cancelled. Repeating the
current status succeeds without writing. Restoring pending and transitions from
unknown legacy statuses return 409. Invalid payloads/IDs return 400, and missing
records return 404. Conditional updates prevent concurrent decisions from
silently overwriting a different status.

Booking, experience, trip-save, and login interfaces now handle request failures
and release their loading states. Booking/experience forms display safe API
errors instead of silently treating failed operations as successful.

## Ownership and validation

Trip updates verify every supplied package ID belongs to the trip before any
mutation. Updates include both package ID and parent trip ID; deletions always
include parent trip ID. New trips cannot reuse existing package IDs. Duplicate IDs
are rejected. Omitting packages leaves them untouched; an explicit empty array
removes only that trip's packages. Trip/package updates use a serializable
transaction, returning 409 on write conflicts.

Dependency-free, schema-style validation explicitly whitelists trip and experience
fields. It rejects nested Prisma writes, unsupported fields, invalid publication
states, invalid slugs, missing core text, negative/fractional/out-of-range prices,
unsafe image schemes, malformed JSON, and JSON with the wrong shape. Package
validation checks IDs, duration, price-on-request, publication rules, itinerary
objects, string lists, URL fields, and array limits. Invalid JSON is rejected,
rather than silently replaced with empty content. Nonempty itinerary days require
a day label and title. Empty legacy optional content remains accepted.

Andaman retains its existing special pricing format. Validation checks the fields
its component reads, minimum selectable tiers/durations, matching price-vector
lengths, and the current five-duration limit. Its promoDiscount is a flat rupee
amount, not a percentage. The existing local snapshots for Andaman, Jibhi, and
Darjeeling pass the new trip validator; no content was added or changed.

## Login and sessions

- Best-effort, bounded, in-process login limiter: five attempts per normalized
  account per 15 minutes, plus 100 total attempts per minute per process. Slots
  are reserved before asynchronous password verification. Success clears the
  account counter. Raw emails are not stored in limiter keys.
- Unknown accounts still undergo a dummy bcrypt comparison. Unknown accounts,
  incorrect passwords, and unsupported roles get the same generic login failure.
- JWT sessions have an eight-hour rolling max age. On each session evaluation,
  the server checks that the account exists, has an allowed role, and still has
  the same password verifier. Roles are refreshed from the database immediately.
  An internal verifier-derived tag stays inside the encrypted JWT and is never
  copied to the browser session response.
- Password changes invalidate previous tokens on their next authenticated
  request. Deleted/nonstaff accounts are denied. This requires no new DB columns.
- Existing tokens lack the new tag and must sign in once after deployment.
  No current production sessions were changed by this local implementation.
- NextAuth debug output is disabled; auth logging records error codes without
  raw exception metadata or credential values.

The limiter is NOT a distributed rate limit: Vercel instances/restarts do not
share its counters. Durable rate limiting needs a shared atomic store or a
Vercel/WAF rule, configured and reviewed before rollout. Per-account throttling
also permits temporary account lockout by an attacker; the global limiter can
temporarily affect other logins on that instance. MFA is not implemented.

## Seed and password recovery

The fixed seed password and default admin email were removed. Seeding now refuses
deployed environments and all nonlocal database hosts, even with the old
confirmation setting. It requires explicit confirmation and an operator-supplied
email and strong password. Existing users' passwords remain untouched by seed
upserts. Seed errors do not dump raw DB details. The seed was NOT executed.

`scripts/reset-admin-password.mjs` is an offline operator tool, not a public reset
endpoint. It requires `--email ACCOUNT --confirm-reset`, a trusted interactive
terminal, and two hidden password prompts. It refuses password arguments/pipes.
Remote/production targets additionally require `--allow-remote-reset`, which
must only be used after explicit approval. It validates password length, hashes
with bcrypt cost 12, and updates only the selected existing staff account using
a compare-and-update guard. It does not change roles or other users. It never
prints passwords, hashes, or raw database exceptions.

The reset script was syntax-checked but NOT executed. Do not invoke it without
authorization. Once the auth changes are deployed, a successful approved reset
invalidates that account's old JWTs on their next authenticated request.

Self-service email recovery is not added: it needs verified email delivery,
expiring one-time reset tokens, durable storage, and distributed abuse controls.
Removing the fixed seed value cannot remove historical copies or change an
account that might have used it. Any such credential rotation needs owner approval.
Independent per-session revocation is not provided; a future session registry or
version column would need a reviewed schema change. Session checks now depend on
database availability and add one account lookup per evaluation.

## Changed files

- Auth/policy: `lib/auth.ts`, `lib/admin-access.ts`, `lib/requireAdmin.ts`,
  `lib/login-throttle.ts`, `lib/admin-errors.ts`, `lib/booking-status.ts`.
- Validation: `lib/content-validation.ts`, `lib/validation.ts`.
- APIs: both admin trip routes, admin experience creation, admin booking update,
  and the authenticated GET handler in `app/api/bookings/route.ts`.
- Admin UI: dashboard, layout, login, users/bookings pages, `BookingActions`,
  `AddExperience`, and `TripForm`.
- Credentials tooling: `prisma/seed.ts`, `lib/seed-policy.ts`, and the offline
  password-reset script.
- Tests: admin authorization/ownership/status routes, auth callbacks, login
  throttling, content validation, seed policy, and updated validation expectations.

## Rollout

No new dependency, environment secret, or migration is needed for these local
changes. Deployment remains pending owner approval. Preserve the existing
DATABASE_URL and NEXTAUTH_SECRET configuration; do not rotate secrets as part of
routine rollout. Expect staff to sign in once. Review editor/admin role assignments
and configure durable throttling separately. Do not run the seed or reset script
as part of a build/deployment.

## Verification

- `npm test`: 218 tests passed across eight files, using mocked database/session
  boundaries for write-path tests; no production requests or records were mutated.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, including Next.js TypeScript checking. The existing
  multiple-lockfile workspace-root warning remains; unrelated configuration was
  not changed.
- `node --check scripts/reset-admin-password.mjs`: passed without executing it.
- `git diff --check`: passed.
- The three prior local trip snapshots all pass the new validator.

Authenticated browser interaction and an actual credential reset were not
performed. The existing admin styling and public page source remain unchanged;
only permission-dependent visibility and failure feedback were adjusted.
