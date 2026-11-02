import { durationDays } from '@/lib/trip-duration'
export { durationDays } from '@/lib/trip-duration'
import { eligibleOffers, quoteOffer, type UniversalConfig, type UniversalPackage } from '@/lib/universal-trip'

export interface SummaryTrip {
  type: string; price: number; duration: string; pricing: string; durLabels: string; tierDetails: string
  packages: UniversalPackage[]
}
type Option = { price: number | null; duration: string; days: number | null }
function parse(value: string): unknown { try { return JSON.parse(value) } catch { return null } }
function positive(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value > 0 }

function durationLabel(days: number, nights: number) { return `${days} ${days === 1 ? 'day' : 'days'} · ${nights} ${nights === 1 ? 'night' : 'nights'}` }

// Display-only projection. Never mutates stored pricing or changes quote arithmetic.
export function publicTripSummary(trip: SummaryTrip, config: UniversalConfig | null = null) {
  let options: Option[] = []
  if (config) {
    options = eligibleOffers(config, trip.packages).map(({ pkg, offer }) => ({
      price: quoteOffer(config, trip.packages, pkg.slug, Math.min(2, config.maxPeople)).perPerson,
      duration: config.durations.find(d => d.id === offer.durationId)?.label || durationLabel(pkg.days, pkg.nights), days: pkg.days,
    }))
  } else if (trip.type === 'andaman') {
    const raw = parse(trip.pricing) as { durations?: { label: string }[]; tiers?: { price: number[] }[] } | null
    if (Array.isArray(raw?.durations) && Array.isArray(raw?.tiers)) {
      options = raw.durations.flatMap((d, index) => raw.tiers!.flatMap(tier => positive(tier.price?.[index])
        ? [{ price: tier.price[index], duration: d.label, days: durationDays(d.label) }] : []))
    }
  } else {
    const packages = trip.packages.filter(p => p.status === 'published' && !p.slug.startsWith('universal-'))
    if (packages.length) options = packages.map(p => ({ price: p.priceOnRequest ? null : p.priceAdult, duration: durationLabel(p.days, p.nights), days: p.days }))
    else {
      const matrix = parse(trip.pricing)
      const labels = parse(trip.durLabels)
      const tiers = parse(trip.tierDetails)
      if (Array.isArray(matrix)) options = matrix.flatMap((row, index) => {
        // The enquiry fallback always quotes the first matrix cell. Without duration
        // labels the calculator also offers no way to select another row.
        if (index > 0 && (trip.type !== 'calculator' || !Array.isArray(labels) || !labels[index])) return []
        // Unnamed legacy tiers are not selectable in the public calculator.
        const visibleColumns = trip.type === 'calculator' && Array.isArray(tiers) && tiers.length ? tiers.length : 1
        const label = Array.isArray(labels) && typeof labels[index] === 'string' ? labels[index] : trip.duration
        return Array.isArray(row) ? row.slice(0, visibleColumns).filter(positive).map(price => ({ price, duration: label, days: durationDays(label) })) : []
      })
    }
  }
  const priced = options.filter((o): o is Option & { price: number } => positive(o.price)).sort((a, b) => a.price - b.price)
  const starting = priced[0] ?? options[0]
  const days = options.map(o => o.days).filter((d): d is number => d !== null && d > 0)
  const minDays = days.length ? Math.min(...days) : durationDays(trip.duration)
  const maxDays = days.length ? Math.max(...days) : minDays
  return {
    price: starting?.price ?? trip.price,
    priceOnRequest: options.length ? !priced.length : !positive(trip.price),
    duration: starting?.duration || trip.duration,
    durationDays: starting?.days ?? minDays,
    durationRange: minDays && maxDays ? minDays === maxDays ? `${minDays} days` : `${minDays}–${maxDays} days` : trip.duration,
    priceBasis: 'per person · based on 2 travellers',
  }
}
