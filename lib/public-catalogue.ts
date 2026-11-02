import { getClassifications, getPublishedTreks } from '@/lib/treks/store'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { loadUniversal } from '@/lib/universal-store'
import { publicTripSummary } from '@/lib/public-trip-summary'

export const getPublicCatalogue = cache(async () => {
  const trips = await prisma.trip.findMany({
    where: { status: 'published' }, orderBy: { createdAt: 'desc' },
    include: { packages: { where: { status: 'published' }, orderBy: { sortOrder: 'asc' } } },
  })
  const kinds = new Map((await getClassifications(trips.map(t => t.id))).map(c => [c.tripId, c.kind]))
  const treks = new Map((await getPublishedTreks()).filter(t => !t.content.fixture).map(t => [t.id, t]))
  return Promise.all(trips.filter(t => kinds.get(t.id) !== 'TREK' || treks.has(t.id)).map(async trip => {
    const summary = publicTripSummary(trip, await loadUniversal(trip))
    const trek = treks.get(trip.id)
    if (trek) { summary.price = trek.startingPrice ?? trip.price; summary.priceOnRequest = trek.startingPrice === null }
    return {
      productKind: kinds.get(trip.id) ?? null, publicPath: kinds.get(trip.id) === 'TREK' ? `/treks/${trip.slug}` : `/trip/${trip.slug}`, ...(trek?.content.enquiryOnly ? { enquiryOnly: true } : {}),
      id: trip.id, slug: trip.slug, title: trip.title, subtitle: trip.subtitle,
      location: trip.location, category: trip.category, difficulty: trip.difficulty,
      image: trip.image, gallery: trip.gallery, route: trip.route, status: trip.status,
      highlights: trip.highlights, itinerary: trip.itinerary, ...summary,
    }
  }))
})
