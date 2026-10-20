# Trip detail production repair — 2026-10-20

## Evidence and cause

Production returned HTTP 500 for `/trip/darjeeling`, `/trip/andaman`, and
`/trip/jibhi`. Vercel runtime logs reported Prisma `P2021`:
`The table public.TripPackage does not exist in the current database`.
The exact `findUnique` query including published packages reproduced this error.
The homepage's Trip-only queries succeeded. Slugs matched the published records;
async Next.js route params were already handled correctly.

Read-only inspection also showed that Booking lacked `packageId`, `packageLabel`,
and `estimatedPrice`. The application schema had advanced without the matching
database upgrade. Prisma generation during build only generates the client; it
does not update the database. This was not a missing DATABASE_URL or a client/server
import failure. Existing JSON fields on all three records parsed successfully.

## Repair and deployment

`prisma/upgrades/20261020_trip_packages.sql` adds only the missing package table,
indexes, foreign key, and Booking columns in a transaction. It neither seeds nor
updates trip content. It was applied to production and successfully re-run.
All published Trip records were compared with a pre-upgrade snapshot and are
unchanged. The exact detail queries and Booking query now succeed.

For an existing database that needs the same upgrade, set DATABASE_URL to the
intended PostgreSQL database and run:

```sh
npm run db:upgrade:packages
npm run build
```

The Prisma CLI does not automatically load `.env.local`. Supply DATABASE_URL through
the shell or deployment environment. Locally, Node can load it explicitly:

```sh
node --env-file=.env.local node_modules/prisma/build/index.js db execute --schema prisma/schema.prisma --file prisma/upgrades/20261020_trip_packages.sql
```

Production trip pages recovered immediately after the database repair, without a
redeploy. Deploy the code changes through the existing Vercel workflow to ship the
Andaman enquiry correction and published-only detail API. No new environment
variables are required. Apply the SQL upgrade separately to any preview database
before using this package-aware application. Do not run the seed or a database reset.

## Enquiries and public API

Andaman's existing Submit enquiry button sent `phone: 'via form'`, which fails
phone validation, then displayed success without checking the response. It now
opens the existing BookingModal, preserving the button style and carrying the
selected duration, tier, traveller count, and estimate into the enquiry. The
existing form handles API failures and only reports success after acceptance.
No test enquiries were submitted to production.

The public detail API now returns only published packages and returns 404 for
unpublished trips, matching the detail page's existing publication rules.
No homepage, stylesheet, or trip presentation component was redesigned.

## Verification

- `npm test`: 47 tests passed, including detail API publication/404 regressions.
- `npm run build`: passed, including Next.js TypeScript checking.
- `npx tsc --noEmit`: passed.
- `node scripts/verify-trip-pages.mjs https://staylocal-v2.vercel.app`: passed for
  every published trip, checking homepage links, HTTP status, stored hero image,
  initial price, stored initial itinerary, WhatsApp link, and API content equality.
- Nonexistent page and API routes both returned HTTP 404.
- The same smoke test passed against the local production build at
  `http://127.0.0.1:3013`, including the updated detail API.

## Existing content needing owner review

Darjeeling's stored itinerary and tier details are empty, its duration summary is
blank, and its card price is 5,999 while its first calculator price is 4,999.
These values were preserved. Supply approved itinerary and pricing updates through
the existing content workflow; no itinerary or price was invented for this repair.
Andaman uses its existing component itinerary; Jibhi uses its stored itineraries.
