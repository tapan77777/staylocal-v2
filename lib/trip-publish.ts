import type { Prisma, Trip } from '@prisma/client'
import type { ValidatedPackage } from '@/lib/validation'

export function publishProblems(trip: Prisma.TripUncheckedCreateInput, packages: Pick<ValidatedPackage, 'status' | 'label' | 'days' | 'itinerary'>[], existing?: Pick<Trip, 'type' | 'pricing'>): string[] {
  const issues: string[] = []
  if (!trip.image) issues.push('Add a cover photo before publishing.')
  let hasLegacyPricing = false
  try { const pricing = JSON.parse(existing?.pricing ?? '[]'); hasLegacyPricing = Array.isArray(pricing) && pricing.length > 0 } catch { /* validation reports malformed data */ }
  const legacy = !!existing && (existing.type === 'andaman' || hasLegacyPricing)
  if (!trip.duration && !legacy) issues.push('Add a duration summary before publishing.')
  const published = packages.filter(p => p.status === 'published')
  if (!published.length && !legacy) issues.push('Add at least one ready package before publishing.')
  for (const pkg of published) {
    let days: { title?: string; desc?: string }[] = []
    try { days = JSON.parse(pkg.itinerary) } catch { /* validation also rejects malformed JSON */ }
    if (!Array.isArray(days) || days.length !== pkg.days || days.some(d => typeof d?.title !== 'string' || !d.title.trim() || typeof d?.desc !== 'string' || !d.desc.trim())) {
      issues.push(`${pkg.label}: add a title and description for all ${pkg.days} itinerary days.`)
    }
  }
  return issues
}
