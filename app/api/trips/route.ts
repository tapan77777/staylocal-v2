import { publicTripPrices } from '@/lib/public-trip-prices'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const trips = await prisma.trip.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(await publicTripPrices(trips))
}
