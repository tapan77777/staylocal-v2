-- LOCAL preparation only. Requires explicit approval before any remote execution.
CREATE TABLE IF NOT EXISTS "TripExperience" (
  "tripId" INTEGER PRIMARY KEY REFERENCES "Trip"("id") ON DELETE CASCADE,
  "config" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
