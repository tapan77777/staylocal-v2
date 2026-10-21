import { prisma } from '@/lib/prisma'
import { loadUniversal, universalAvailable } from '@/lib/universal-store'
import { startingPrice } from '@/lib/universal-trip'

export async function publicTripPrices<T extends { id: number; price: number }>(trips: T[]): Promise<(T & { priceOnRequest?: boolean })[]> {
  if (!universalAvailable()) return trips
  return Promise.all(trips.map(async t => {
    const trip = await prisma.trip.findUnique({ where: { id: t.id }, include: { packages: { where: { status: 'published' } } } })
    if (!trip) return t
    const config = await loadUniversal(trip)
    if (!config) return t
    const price = startingPrice(config, trip.packages)
    return { ...t, price: price ?? t.price, priceOnRequest: price === null }
  }))
}
