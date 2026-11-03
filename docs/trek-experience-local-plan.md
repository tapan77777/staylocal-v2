# Reusable Trek experience — local implementation plan

3 November 2026. Production trek activation remains disabled. No production connection, migration, flag update, deployment or record creation is authorized.

- Extend the existing seven-section Trek Builder and TrekContent JSON with route illustration/media review, terrain/stay/meal/travel detail and pricing options. Existing content gets safe defaults.
- Reuse TripPackage rows for stable option/package identity, INR public selling prices and shared Booking enquiries. Reuse TrekDeparture keys for each option's dates; enforce option ownership server-side. No seat inventory or new tour pricing rules.
- Separate operator net costs from public content in a versioned JSON storage envelope. Only authenticated admin reads receive private costs; public DTOs explicitly project public fields. Show margin only in Admin. Never derive a selling price from a private cost.
- Public prices require explicit confirmation and an eligible published package. Enquiry-only and unknown prices use WhatsApp; old single-package pricing remains compatible. Keep departure overrides on legacy treks; option prices are set at option level.
- Add an original SVG concept map (no geographic scale/GPS claim), uploaded map support and keyboard-accessible image zoom. Retain verified waypoint and textual fallbacks. Concept artwork must always carry its non-navigation warning.
- Reuse the existing local Kedarkantha fixture draft if present; leave it unpublished, provisional and unreviewed, with no selling prices/dates/operator assertions. Existing illustrative photographs are labelled as such.
- Run focused privacy, pricing/ownership, validation and UI tests; TypeScript and webpack production build. Capture desktop/360px/390px public-template previews, horizontal card and admin screens using the isolated loopback database only.

No additional SQL migration is planned: existing TripPackage/TrekContent/TrekDeparture/Booking/TrekEnquiry storage is sufficient. The original additive trek migration is still a production prerequisite if absent, subject to production database identity and restorable backup verification. JSON-envelope writes require the new reader; retain that reader during rollback and suspend authoring rather than reverting to an incompatible build.
