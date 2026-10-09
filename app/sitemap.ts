import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { brand } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.siteUrl
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/trips`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  let tripEntries: MetadataRoute.Sitemap = []
  try {
    const trips = await prisma.trip.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
    })
    tripEntries = trips.map(t => ({
      url: `${base}/trip/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    tripEntries = []
  }

  return [...staticEntries, ...tripEntries]
}
