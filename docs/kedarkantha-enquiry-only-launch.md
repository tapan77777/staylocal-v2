# Kedarkantha enquiry-only launch — code ready

2 November 2026. No migration, deployment, publication or production record change was performed.

## Implemented

- Explicit `content.enquiryOnly` checkbox in the existing Trek Builder pricing section, stored in existing version-1 JSON. Old records default to false. Enabling it clears/disables starting price; contradictory enquiry-only + priced input is rejected.
- A reviewed enquiry-only trek may publish with a null price and no departures. **All existing operator/safety, route, factual-content and media publication requirements remain.** This is not a shortcut around review.
- Cards, details and the mobile action show **Enquire for dates & pricing**. Enquiry-only reads suppress all price/departure offers, including stale internal values; SEO emits no Offer or invented availability.
- The enquiry-only action uses the existing configured StayLocal WhatsApp number and prefilled trek message. No priced form, fake zero quote or Booking is generated. WhatsApp conversations are not automatically saved into website Bookings. Existing priced enquiry forms, booking persistence and tour calculations remain unchanged.
- Fixtures cannot be published, even in the local review runtime. All published-content reads exclude them, and fixture Booking attempts fail. Private admin previews remain available with enquiries disabled. No fixture records were changed or copied.
- No redesign, other trek creation or additional feature was introduced. Protected homepage, popup, `/tours`, pricing and authentication file hashes are unchanged.

`vercel.launch.json` is an **opt-in** webpack configuration for the approved production release. It has no staging noindex headers and changes no remote setting by itself. Do not use `vercel.staging.json` for production.

## Checks

**68 focused tests / 10 files passed**, including explicit-mode publication, retained safety reviews, WhatsApp/preview behavior, no price/Offer leakage, fixture blocking, existing tour pricing and discovery compatibility. The webpack production build, including TypeScript compilation, passed against the disposable local database. No full test suite, general lint cleanup or Turbopack run was performed.

Evidence: [focused tests](../artifacts/kedarkantha-launch/focused-tests.txt), [build](../artifacts/kedarkantha-launch/webpack-build.txt), [preserved files](../artifacts/kedarkantha-launch/preserved-files.json).

## Production read-only check

The Vercel project `staylocal-v2` / `prj_nBpytWrr3c0XzBDLVxX57OCI7lBz` and its active READY Production deployment were verified through GET requests. Its Production DATABASE_URL is sensitive and the read interface returned no usable connection value. **The actual production database identity remains unverified; no fallback connection was contacted.** No current, production-linked backup/restore evidence was available through the authorized access, so backup status remains unverified—not presumed absent.

[Sanitized read-only result](../artifacts/kedarkantha-launch/production-readonly.json). Credentials were not exposed. The migration, environment files and Vercel project link are unchanged.

## Short remaining launch checklist — approval required

1. **Database owner verifies the exact production provider/project/branch/database identity and a current restorable backup**, including timestamp/restore point. Confirm whether ProductKind and the four trek sidecar tables already exist. Do not use `.env.staging` or `.env.local` as an unverified fallback.
2. If the trek schema is absent, approve and apply only `prisma/upgrades/20261102_trek_system.sql` to that verified target. Its SHA-256 remains `804ffea17c4294d01be1b0242fe33d6c7f08c171f4359d7b508b8abeb4b20ffc`. It is transactional, one-time and additive; it does not change existing tour/customer records. **The enquiry-only flag needs no additional SQL migration.** If tables already exist, compare their schema rather than rerunning the upgrade.

   After identity/backup verification and explicit migration approval only:

   ```sh
   : "${VERIFIED_PRODUCTION_DATABASE_URL:?verified target required}"
   DATABASE_URL="$VERIFIED_PRODUCTION_DATABASE_URL" npx prisma db execute --schema prisma/schema.prisma --file prisma/upgrades/20261102_trek_system.sql
   ```

3. Approve the exact release candidate and existing Vercel target. After schema verification, deploy using the tested webpack path, with fixture mode absent:

   ```sh
   vercel deploy --prod --scope tapan77777s-projects --local-config vercel.launch.json \
     --build-env TREK_SYSTEM_ENABLED=1 --env TREK_SYSTEM_ENABLED=1 \
     --build-env TREK_WRITES_ENABLED=1 --env TREK_WRITES_ENABLED=1
   ```

   This command is **prepared, not executed**. Reconfirm the local project link before execution. It retains the existing production domain and does not change DNS.

4. Finalize **one genuine Kedarkantha record** with verified content/media and a real named operator/safety review. The old acceptance draft is a fixture, with proposed/test content and an unreviewed operator section; it must not be promoted or published. Use only its independently verified content in the clean real record, select enquiry-only, leave price null and departures empty, preview, then publish `/treks/kedarkantha` only after explicit publication approval.
5. Smoke-test `/`, popup, `/treks`, `/tours`, existing tour pricing/enquiries, Kedarkantha WhatsApp destination/message, canonical/sitemap, and fixture/draft exclusion. If a problem occurs after publication, preserve the dedicated read routes and records; suspend trek authoring and repair forward. Do not drop sidecars or erase bookings.

Until steps 1 and 4 are satisfied, code readiness does not make the current draft publication-ready. No approval for migration, deployment or publication is inferred from permission to prepare this code.
