import { getClassifications, getPublishedTreks } from '@/lib/treks/store'
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { brand } from '@/lib/config'

// Query at request time so new publications cannot be frozen into a build-time sitemap.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.siteUrl

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/treks`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/tours`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/trips`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cancellation`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Fail visibly on database errors rather than serve a successful incomplete sitemap.
  const trips = await prisma.trip.findMany({
    where: { status: 'published' }, select: { id: true, slug: true, updatedAt: true },
  })
  const kinds = new Map((await getClassifications(trips.map(t => t.id))).map(c => [c.tripId, c.kind]))
  const trekIds = new Set((await getPublishedTreks()).filter(t => !t.content.fixture).map(t => t.id))
  const tripEntries: MetadataRoute.Sitemap = trips.filter(t => kinds.get(t.id) !== 'TREK' || trekIds.has(t.id)).map(t => ({
    url: `${base}/${kinds.get(t.id) === 'TREK' ? 'treks' : 'trip'}/${t.slug}`, lastModified: t.updatedAt, changeFrequency: 'weekly', priority: 0.8,
  }))
  return [...staticEntries, ...tripEntries]
}
