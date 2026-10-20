-- Add the package schema to existing StayLocal databases without reseeding trips.
-- Safe to re-run. Keep the entire upgrade atomic.
BEGIN;

CREATE TABLE IF NOT EXISTS "public"."TripPackage" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "tripId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "priceAdult" INTEGER NOT NULL,
    "priceBasis" TEXT NOT NULL DEFAULT 'per adult, twin sharing',
    "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "itinerary" TEXT NOT NULL DEFAULT '[]',
    "accommodation" TEXT NOT NULL DEFAULT '',
    "inclusions" TEXT NOT NULL DEFAULT '[]',
    "exclusions" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripPackage_tripId_fkey" FOREIGN KEY ("tripId")
        REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TripPackage_tripId_sortOrder_idx"
    ON "public"."TripPackage"("tripId", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "TripPackage_tripId_slug_key"
    ON "public"."TripPackage"("tripId", "slug");

ALTER TABLE "public"."Booking"
    ADD COLUMN IF NOT EXISTS "packageId" INTEGER,
    ADD COLUMN IF NOT EXISTS "packageLabel" TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS "estimatedPrice" INTEGER;

COMMIT;
