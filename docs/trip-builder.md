# StayLocal Trip Builder

Implemented locally in the existing Next.js application. No push, deployment,
production migration, seed, credential reset, or database write was performed.
The prior Phase 1 work remains in place. Prisma models, homepage source, public
trip components, existing published URLs, and public pricing functions are unchanged.

## Operator workflow

The existing Add/Edit routes now load the same five-step builder:

1. **Basics:** title, automatic slug with authenticated availability checking and
   collision suggestions, destination, category, introduction, difficulty, and
   duration summary. New slugs remain editable. Existing trip URLs are read-only
   and protected by the API. Technical trip types are preserved internally.
2. **Photos:** optional authenticated upload, URL fallback, previews, cover choice,
   removal, and keyboard-accessible ordering. An explicit photo edit makes the
   first photo the cover and first gallery image. Loading an existing trip alone
   never changes its stored image order.
3. **Packages & Itinerary:** expandable package cards, duration, price or
   price-on-request, price basis, accommodation, photo URL, inclusions/exclusions,
   notes, and visual day-by-day editing. Packages can be ordered and marked ready.
   Draft packages remain unpublished. Saved-package removal requires confirmation
   and can be undone before saving.
4. **Trip Details:** route, highlights, included/not-included lists, and FAQ editors
   with add/remove/reorder controls. No raw JSON input is required.
5. **Review & Publish:** customer-content preview, publishing errors, inconsistency
   warnings, explicit review confirmation, Save Draft, and Publish. Publishing a
   new trip requires a cover, duration summary, and a ready package with complete
   day titles and descriptions. The server enforces those rules too. Existing
   valid legacy trips can retain their calculator without adding packages.

Form state survives wizard navigation. Unsaved document navigation is guarded;
draft saves are explicit, not automatic. Save a draft before intentionally leaving
or closing the builder. Inputs and navigation are locked during save/upload.
Request failures retain local values and display actionable feedback. Unpublishing
an existing public trip requires a separate confirmation.

The green/cream styling uses CSS Modules scoped to the builder. On small screens
its admin navigation becomes horizontal; unrelated dashboard layouts and public
styles are preserved. Step buttons, labels, focus handling, ordering controls,
status/error announcements, and reduced-motion support are included.

## Compatibility and data protection

- Existing record IDs, slugs, trip types, package IDs, base prices, and legacy
  fields are hydrated instead of regenerated. Only new trips receive automatic
  card-price and duration suggestions, until the operator edits those values.
- Advanced/Legacy is a collapsed, read-only section for existing trips only.
  Legacy JSON is sent unchanged by the builder and preserved exactly by the API
  when untouched. Package JSON receives the same preservation treatment.
- Adding a **ready** package to a legacy calculator intentionally switches the
  existing public component to its package picker. Review warns about this;
  adding draft packages alone does not switch the public page.
- Zod strictly validates request shapes, save metadata, numeric inputs, enums,
  image URLs, IDs, and JSON string bounds. Existing deep JSON/pricing checks remain
  in place. Ownership requires an additional database check inside the transaction.
- Every edit includes the record's original `expectedUpdatedAt`. Missing/stale
  versions return 409. Serializable transactions protect concurrent edits.
- Saved package deletion requires explicit `removedPackageIds`; a missing item
  in an array cannot silently delete it. Ownership is checked before mutation,
  and all package updates/deletions are scoped to the parent trip.
- Publication requires `publishConfirmed: true` and valid readiness checks.
  Unique database constraints remain the final authority on slug collisions.

Existing API consumers must include the version/confirmation metadata when
updating or publishing. No database/schema change is needed.

## Photos and required configuration

No media/storage service existed in application code. The optional server upload
integration uses Vercel Blob and Sharp; details are in
[media configuration](trip-builder-storage.md). It requires an operator-created
**public Blob store** and server-only `BLOB_READ_WRITE_TOKEN`. Nothing was configured
or provisioned. Without it, URL photos work and the upload control explains why
uploads are unavailable.

Uploads require the existing authenticated admin/editor content permission and
same-origin write checks. They accept JPEG/PNG/WebP up to 4 MiB, stream-limit the
request, decode real bytes, reject MIME mismatches/animation/overlarge dimensions,
strip metadata, resize within 2400 × 2400, and store WebP under a generated path.
SVG is rejected. SDK errors are not exposed to operators. URL fallback validates
the URL but does not server-fetch arbitrary external images.

Live storage uploads were not exercised: route tests mock storage and use real
Sharp decoding. Removing a photo does not delete its remote object. Unsaved
uploads can be orphaned; automatic cleanup and storage quotas need a separately
reviewed policy. Configure separate stores/tokens for preview and production.

## Known limitations

- **Andaman remains special.** Its public page ignores normal packages and uses
  special pricing plus hardcoded itineraries. Package and legacy-price changes
  are blocked in this builder/API; general metadata, photos, and details remain
  editable. A unified migration requires separate approval. No Andaman pricing
  or hardcoded content was rewritten.
- Existing legacy content gaps are preserved rather than filled with invented
  itineraries. Review warns about missing packages/duration and price mismatches.
- The public card still uses a numeric base price independently of package prices,
  including price-on-request packages. The builder warns; public logic is unchanged.
- Review previews customer content; it does not claim to reproduce the dedicated
  public calculator layouts or send a real customer enquiry.
- Existing slugs are intentionally locked to preserve previously shared URLs;
  changing them requires a separate redirect-aware workflow.
- `npm audit` reports 17 dependency findings (including existing Next.js and
  NextAuth advisories). Those framework versions were retained rather than
  upgraded as an unrelated UI change. Review dependency updates separately before
  rollout. The reported Sharp finding is under Next's older nested dependency,
  not the new direct upload dependency.

## Files changed for this builder

- `components/admin/TripForm.tsx`: wizard state, steps, preview, confirmation,
  field feedback, safe saving, and navigation guards.
- `components/admin/PackagesEditor.tsx`: visual package and day-wise editors.
- `components/admin/builder/`: scoped styles, photo editor, and reusable list/order
  controls.
- `app/admin/layout.tsx`, `app/admin/admin-shell.module.css`, and the two trip
  route pages: responsive builder shell and removal of duplicate form headings.
- `lib/trip-builder.ts`, `lib/trip-schemas.ts`, `lib/trip-publish.ts`: hydration,
  compatible serialization, Zod shapes, and publication policy.
- `lib/content-validation.ts`, `lib/validation.ts`: integrate Zod and permit
  unfinished itinerary titles only in draft packages.
- Admin trip APIs: versions, publication confirmation, explicit removals,
  immutable URLs/types, and unchanged legacy JSON preservation.
- `app/api/admin/trips/check-slug/route.ts`: authenticated availability checking.
- `app/api/admin/media/route.ts`, `lib/image-policy.ts`, `lib/image-upload.ts`:
  optional secure storage integration.
- `package.json`, lockfile, Vitest config, and new/updated tests: dependencies and
  regression coverage for creation, editing, publishing, ownership, images,
  itinerary editing, invalid inputs, and legacy preservation.

## Screenshots and browser checks

Screenshots use the actual builder and admin shell in an isolated local component
harness with mocked session/API boundaries and local sample data. No authentication
bypass or preview route was added to the application; no production account was
used and no save reached a database.

- [Desktop basics](../artifacts/trip-builder/desktop-basics.png)
- [Desktop photos](../artifacts/trip-builder/desktop-photos.png)
- [Desktop review](../artifacts/trip-builder/desktop-review.png)
- [Mobile basics](../artifacts/trip-builder/mobile-basics.png)
- [Mobile packages](../artifacts/trip-builder/mobile-packages.png)

Headless Chrome checked all five steps at 1440px and 390px: no horizontal overflow
and no browser runtime errors.

## Final verification

- `npm test`: **262 tests passed across 11 files**, including UI interaction,
  API write policy, ownership, legacy preservation, and real image decoding with
  mocked storage. No test writes reached production.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, including Next.js TypeScript checking. The existing
  multiple-lockfile workspace-root warning remains.
- `git diff --check`: passed.
- Desktop/mobile browser checks: all ten step/viewport combinations passed.
- Live Blob uploads and authenticated production editing were not performed.
