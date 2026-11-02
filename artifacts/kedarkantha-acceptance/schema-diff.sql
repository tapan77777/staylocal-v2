-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('TREK', 'TOUR');

-- CreateTable
CREATE TABLE "TripClassification" (
    "tripId" INTEGER NOT NULL,
    "kind" "ProductKind" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripClassification_pkey" PRIMARY KEY ("tripId")
);

-- CreateTable
CREATE TABLE "TrekContent" (
    "tripId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrekContent_pkey" PRIMARY KEY ("tripId")
);

-- CreateTable
CREATE TABLE "TrekDeparture" (
    "id" TEXT NOT NULL,
    "tripId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priceAdult" INTEGER,
    "capacity" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrekDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrekEnquiry" (
    "bookingId" INTEGER NOT NULL,
    "tripId" INTEGER NOT NULL,
    "departureId" TEXT,
    "departureLabel" TEXT NOT NULL DEFAULT '',
    "priceAdult" INTEGER NOT NULL,

    CONSTRAINT "TrekEnquiry_pkey" PRIMARY KEY ("bookingId")
);

-- CreateIndex
CREATE INDEX "TripClassification_kind_idx" ON "TripClassification"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "TrekContent_packageId_key" ON "TrekContent"("packageId");

-- CreateIndex
CREATE INDEX "TrekDeparture_tripId_startDate_idx" ON "TrekDeparture"("tripId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "TrekDeparture_tripId_key_key" ON "TrekDeparture"("tripId", "key");

-- CreateIndex
CREATE INDEX "TrekEnquiry_tripId_idx" ON "TrekEnquiry"("tripId");

-- AddForeignKey
ALTER TABLE "TripClassification" ADD CONSTRAINT "TripClassification_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekContent" ADD CONSTRAINT "TrekContent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekContent" ADD CONSTRAINT "TrekContent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TripPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekDeparture" ADD CONSTRAINT "TrekDeparture_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekEnquiry" ADD CONSTRAINT "TrekEnquiry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekEnquiry" ADD CONSTRAINT "TrekEnquiry_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrekEnquiry" ADD CONSTRAINT "TrekEnquiry_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "TrekDeparture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

