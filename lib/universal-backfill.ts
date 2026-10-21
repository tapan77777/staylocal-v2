import type { Prisma } from '@prisma/client'
import type { LegacyTripSnapshot } from '@/lib/legacy-universal'
import type { prepareLegacy } from '@/lib/legacy-universal'

export async function stageJibhi(tx: Prisma.TransactionClient, plan: ReturnType<typeof prepareLegacy> & { trip: LegacyTripSnapshot }) {
  if (plan.trip.slug !== 'jibhi') throw new Error('Only the first-stage Jibhi draft backfill is implemented. Other destinations require review.')
  const actual = await tx.trip.findUnique({ where: { slug: 'jibhi' } })
  const keys = ['pricing', 'itinerary', 'durLabels', 'durSubLabels', 'tierDetails', 'duration', 'price', 'image', 'included', 'notIncluded'] as const
  if (!actual || keys.some(k => actual[k] !== plan.trip[k])) throw new Error('Local source differs; stop for review.')
  if (await tx.tripExperience.findUnique({ where: { tripId: actual.id } })) return { created: false }
  for (const [sortOrder, pkg] of plan.packages.entries()) {
    if (await tx.tripPackage.findUnique({ where: { tripId_slug: { tripId: actual.id, slug: pkg.slug } } })) throw new Error('Reserved package slug already exists; stop for review.')
    await tx.tripPackage.create({ data: { ...pkg, status: 'draft', sortOrder, priceBasis: 'per person', tripId: actual.id } })
  }
  await tx.tripExperience.create({ data: { tripId: actual.id, config: JSON.stringify(plan.config), enabled: false } })
  return { created: true }
}
