import { publicTripPrices } from '@/lib/public-trip-prices'
import { loadUniversal, legacyPackages } from '@/lib/universal-store'
import { publicUniversal } from '@/lib/universal-trip'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await prisma.trip.findUnique({
    where: { slug },
    include: { packages: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!trip || trip.status !== 'published') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const config = await loadUniversal(trip)
  const [priced] = await publicTripPrices([trip])
  return NextResponse.json({ ...priced, packages: config ? trip.packages : legacyPackages(trip.packages), ...(config ? { universal: publicUniversal(config, trip.packages) } : {}) })
}
