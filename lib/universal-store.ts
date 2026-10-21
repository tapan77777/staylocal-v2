import { prisma } from '@/lib/prisma'
import { universalSchema, universalProblems, type UniversalTripData } from '@/lib/universal-trip'

export function universalAvailable() { return process.env.UNIVERSAL_TRIPS_ENABLED === '1' }
export async function loadUniversal(trip: UniversalTripData & { id: number; type?: string }) {
  if (!universalAvailable() || trip.type === 'andaman') return null
  const row = await prisma.tripExperience.findUnique({ where: { tripId: trip.id } })
  if (!row?.enabled) return null
  const stored = universalSchema.parse(JSON.parse(row.config))
  const config = { ...stored, offers: stored.offers.filter(o => trip.packages.some(p => p.slug === o.packageSlug && p.status === 'published')) }
  if (universalProblems(config, trip.packages, true).length) throw new Error('Published trip experience requires repair. Disable its universal flag to use the preserved fallback.')
  return config
}
export function legacyPackages<T extends { slug: string }>(packages: T[]) { return packages.filter(p => !p.slug.startsWith('universal-')) }
