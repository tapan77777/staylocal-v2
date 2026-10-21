import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { AdminError } from '@/lib/admin-errors'
import { universalSchema, universalProblems, type UniversalPackage } from '@/lib/universal-trip'

const envelope = z.strictObject({ config: universalSchema, enabled: z.boolean(), expectedUpdatedAt: z.iso.datetime().nullable(), migrationConfirmed: z.boolean().default(false) })
export async function saveUniversal(tx: Prisma.TransactionClient, trip: { id: number; type: string; status: string; pricing?: string }, input: unknown, role: string, oldPackages: UniversalPackage[] = []) {
  if (input === undefined && process.env.UNIVERSAL_TRIPS_ENABLED !== '1') return
  if (process.env.UNIVERSAL_TRIPS_ENABLED !== '1') throw new AdminError('Universal trip storage is not enabled. Complete the approved schema upgrade first.', 503)
  const existing = await tx.tripExperience.findUnique({ where: { tripId: trip.id } })
  if (input === undefined && !existing) return
  if (existing && role !== 'admin') {
    const prior = universalSchema.parse(JSON.parse(existing.config))
    const nextPackages = await tx.tripPackage.findMany({ where: { tripId: trip.id } })
    if (prior.offers.some(o => o.comparison?.approved && nextPackages.some(p => p.slug === o.packageSlug && p.priceAdult !== oldPackages.find(old => old.slug === p.slug)?.priceAdult))) throw new AdminError('Only administrators may revise pricing with approved comparisons.', 403)
  }
  // An existing active config must remain valid even when an older client edits packages.
  if (input === undefined) {
    if (!existing?.enabled || trip.status !== 'published') return
    const config = universalSchema.parse(JSON.parse(existing.config))
    const packages = await tx.tripPackage.findMany({ where: { tripId: trip.id } })
    const issues = universalProblems(config, packages, true)
    if (issues.length) throw new AdminError(issues.join(' '), 422)
    return
  }
  if (trip.type === 'andaman') throw new AdminError('Andaman universal migration is protected pending explicit parity/content review.', 409)
  const parsed = envelope.safeParse(input)
  if (!parsed.success) throw new AdminError('Invalid universal duration, tier, offer or edit version.', 400)
  const { config, enabled, expectedUpdatedAt } = parsed.data
  if ((existing?.updatedAt.toISOString() ?? null) !== expectedUpdatedAt) throw new AdminError('Universal content changed. Reload before saving.', 409)
  if (role !== 'admin' && enabled !== (existing?.enabled ?? false)) throw new AdminError('Only administrators may switch a trip to universal rendering.', 403)
  if (enabled && !existing?.enabled && trip.pricing && trip.pricing !== '[]' && !parsed.data.migrationConfirmed) throw new AdminError('Review the legacy duration, content and pricing parity report and explicitly confirm this migration before activation.', 409)
  const packages = await tx.tripPackage.findMany({ where: { tripId: trip.id } })
  const issues = universalProblems(config, packages, enabled && trip.status === 'published')
  if (issues.length) throw new AdminError(issues.join(' '), 422)
  if (role !== 'admin') {
    const old = existing ? universalSchema.parse(JSON.parse(existing.config)) : null
    for (const offer of config.offers) {
      const before = old?.offers.find(o => o.packageSlug === offer.packageSlug)
      if ((offer.comparison?.approved || before?.comparison?.approved) && (JSON.stringify(offer.comparison) !== JSON.stringify(before?.comparison) || packages.find(p => p.slug === offer.packageSlug)?.priceAdult !== oldPackages.find(p => p.slug === offer.packageSlug)?.priceAdult)) throw new AdminError('Only administrators may approve or revise comparison pricing.', 403)
    }
  }
  await tx.tripExperience.upsert({ where: { tripId: trip.id }, create: { tripId: trip.id, config: JSON.stringify(config), enabled }, update: { config: JSON.stringify(config), enabled } })
}
