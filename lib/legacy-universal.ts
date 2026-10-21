import { emptyUniversal, type UniversalConfig, type UniversalPackage } from '@/lib/universal-trip'

export interface LegacyTripSnapshot {
  id: number; slug: string; type: string; price: number; duration: string; pricing: string; itinerary: string;
  durLabels: string; durSubLabels: string; tierDetails: string; image: string; included: string; notIncluded: string
}
type Day = { day: string; title: string; desc: string }
function json<T>(s: string): T { return JSON.parse(s) as T }
function lengthOf(label: string, marker: string) { return Number(label.match(new RegExp(`(\\d+)\\s*${marker}`, 'i'))?.[1]) }
export function prepareLegacy(trip: LegacyTripSnapshot, andamanItineraries?: Day[][]) {
  const config = emptyUniversal()
  const packages: UniversalPackage[] = []
  const blockers: string[] = []
  const warnings: string[] = []
  const andaman = trip.type === 'andaman'
  const pricing = json<any>(trip.pricing)
  const labels: string[] = andaman ? pricing.durations.map((d: any) => d.label) : json(trip.durLabels)
  const subtitles: string[] = andaman ? pricing.durations.map((d: any) => d.sub) : json(trip.durSubLabels)
  const tiers: any[] = andaman ? pricing.tiers : json(trip.tierDetails)
  const matrix: number[][] = andaman ? labels.map((_, i) => tiers.map(t => t.price[i])) : pricing
  const itineraries: Day[][] = andaman ? andamanItineraries ?? [] : json(trip.itinerary)
  if (!Array.isArray(matrix) || matrix.length !== labels.length || !matrix.length) throw new Error(`${trip.slug}: invalid legacy duration/price mapping.`)
  const tierCount = Math.max(...matrix.map(row => row.length))
  if (tiers.length !== tierCount) blockers.push('Tier names/details are missing; matrix columns cannot be assigned invented names.')
  if (!trip.duration) blockers.push('Trip card duration summary is missing.')
  if (trip.slug === 'jibhi' && trip.duration === '9D · 8N') blockers.push('Card duration is 9D/8N but calculator options are 3D/2N–5D/4N; owner review required.')
  if (trip.price !== matrix[0][0]) warnings.push(`Stored card price ${trip.price} differs from first regular calculator price ${matrix[0][0]}; neither value is overwritten.`)
  if (andaman) { config.maxPeople = 12; config.defaultPackageSlug = 'universal-d2-t2'; blockers.push('Andaman is protected; promo, initial selection, hotels, hardcoded itinerary and comparison evidence require explicit review.') }
  config.durations = labels.map((label, i) => ({ id: `duration-${i + 1}`, label, sub: subtitles[i] ?? '', image: andaman ? pricing.durations[i].image : trip.image }))
  config.tiers = tiers.map((tier, i) => ({ id: `tier-${i + 1}`, name: tier.name, subtitle: andaman ? tier.subtitle : tier.vehicle ?? '', popular: !!tier.popular, meals: tier.meals ?? '', transport: andaman ? tier.ferry : tier.vehicle ?? '', features: andaman ? tier.features : tier.feats ?? [] }))
  for (let d = 0; d < matrix.length; d++) {
    const days = lengthOf(labels[d], 'D'), nights = lengthOf(labels[d], 'N')
    if (!days || !Number.isInteger(nights)) throw new Error(`${trip.slug}: ambiguous duration label.`)
    if (!itineraries[d] || itineraries[d].length !== days) blockers.push(`${labels[d]}: complete itinerary is missing.`)
    for (let t = 0; t < matrix[d].length; t++) {
      if (!Number.isSafeInteger(matrix[d][t]) || matrix[d][t] <= 0) throw new Error(`${trip.slug}: invalid legacy price.`)
      const slug = `universal-d${d + 1}-t${t + 1}`
      const tier = tiers[t]
      // Unnamed columns remain visibly unresolved in local previews, never activated.
      packages.push({ slug, label: `${labels[d]} · ${tier?.name ?? `Unlabelled legacy column ${t + 1}`}`, days, nights, priceAdult: matrix[d][t], priceOnRequest: false, status: 'draft', itinerary: JSON.stringify(itineraries[d] ?? []), accommodation: '', image: '', notes: '', inclusions: trip.included, exclusions: trip.notIncluded })
      const rules = andaman ? [
        { min: 1, max: 1, adjustmentBps: 1500 }, { min: 4, max: 5, adjustmentBps: -500 }, { min: 6, max: 7, adjustmentBps: -1000 }, { min: 8, max: 12, adjustmentBps: -1500 },
      ] : [{ min: 4, max: 5, adjustmentBps: -500 }, { min: 6, max: 50, adjustmentBps: -1000 }]
      config.offers.push({ packageSlug: slug, durationId: config.durations[d].id, tierId: config.tiers[t]?.id ?? null,
        comparison: andaman ? { price: tier.bufferPrice[d], approved: false, evidence: '' } : null,
        rules, rounding: andaman ? 'person' : 'total',
        stays: andaman ? Object.entries(tier.hotels as Record<string, string>).map(([location, name]) => ({ location: ({ portblair: 'Port Blair', havelock: 'Havelock', neil: 'Neil Island' } as Record<string, string>)[location] ?? location, name, image: '' })) : [],
        promo: andaman ? { codes: pricing.promoCodes, price: tier.promoPrice[d] } : null,
      })
    }
  }
  return { config, packages, blockers: [...new Set(blockers)], warnings }
}
