import { z } from 'zod'
import { safeImageUrl, daySchema } from '@/lib/trip-schemas'

const key = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)
const text = z.string().trim().max(2000)
const money = z.number().int().min(0).max(10_000_000)
export const universalSchema = z.strictObject({
  version: z.literal(1), maxPeople: z.number().int().min(1).max(50).default(50),
  defaultPackageSlug: key.nullable().default(null),
  durations: z.array(z.strictObject({ id: key, label: text, sub: z.string().max(2000), image: safeImageUrl })).max(60),
  tiers: z.array(z.strictObject({ id: key, name: text, subtitle: z.string().max(2000), popular: z.boolean(), meals: z.string().max(2000), transport: z.string().max(2000), features: z.array(text).max(100) })).max(20),
  offers: z.array(z.strictObject({
    packageSlug: key, durationId: key, tierId: key.nullable(),
    comparison: z.strictObject({ price: money, approved: z.boolean(), evidence: z.string().max(2000) }).nullable(),
    rounding: z.enum(['total', 'person']),
    rules: z.array(z.strictObject({ min: z.number().int().min(1).max(50), max: z.number().int().min(1).max(50), adjustmentBps: z.number().int().min(-10000).max(10000) })).max(50),
    stays: z.array(z.strictObject({ location: text, name: text, image: safeImageUrl })).max(30),
    promo: z.strictObject({ codes: z.array(z.string().trim().regex(/^[a-zA-Z0-9-]{1,80}$/).transform(s => s.toUpperCase())).min(1).max(30), price: money }).nullable(),
  })).max(100),
}).refine(config => JSON.stringify(config).length <= 250_000, 'Universal trip content is too large.')
export type UniversalConfig = z.infer<typeof universalSchema>
export type Offer = UniversalConfig['offers'][number]
export interface UniversalPackage {
  id?: number; slug: string; label: string; days: number; nights: number; priceAdult: number; priceOnRequest: boolean;
  status: string; itinerary: string; accommodation: string; inclusions: string; exclusions: string; notes: string; image: string
}
export interface UniversalTripData {
  slug: string; title: string; subtitle: string; location: string; category: string; route: string; image: string;
  gallery: string; highlights: string; included: string; notIncluded: string; faqs: string; packages: UniversalPackage[]
}
export const emptyUniversal = (): UniversalConfig => ({ version: 1, maxPeople: 50, defaultPackageSlug: null, durations: [], tiers: [], offers: [] })
export function parseList<T>(value: string): T[] { try { const a: unknown = JSON.parse(value); return Array.isArray(a) ? a as T[] : [] } catch { return [] } }

export function universalProblems(config: UniversalConfig, packages: UniversalPackage[], publishing = false): string[] {
  const issues: string[] = []
  for (const [name, values] of [['duration', config.durations.map(d => d.id)], ['tier', config.tiers.map(t => t.id)], ['offer', config.offers.map(o => o.packageSlug)]] as const) {
    if (new Set(values).size !== values.length) issues.push(`Duplicate ${name} identifier.`)
  }
  const combinations = new Set<string>()
  let ready = 0
  for (const offer of config.offers) {
    const pkg = packages.find(p => p.slug === offer.packageSlug)
    if (!pkg) { issues.push('An offer references a package outside this trip.'); continue }
    if (!config.durations.some(d => d.id === offer.durationId) || (offer.tierId !== null && !config.tiers.some(t => t.id === offer.tierId)) || (config.tiers.length > 0 && offer.tierId === null)) issues.push('An offer has an invalid duration or experience tier.')
    const combination = `${offer.durationId}/${offer.tierId}`
    if (combinations.has(combination)) issues.push('Use one offer per duration and tier.')
    combinations.add(combination)
    if (offer.comparison?.approved && (!offer.comparison.evidence.trim() || offer.comparison.price <= pkg.priceAdult || pkg.priceOnRequest || offer.rules.some(r => r.adjustmentBps > 0))) issues.push('Approved comparison pricing needs evidence, a higher genuine price and no surcharge rule.')
    if (offer.promo && (pkg.priceOnRequest || offer.promo.price >= pkg.priceAdult)) issues.push('Promo selling price must be below the regular selling price.')
    const covered = new Set<number>()
    for (const rule of offer.rules) {
      if (rule.min > rule.max || rule.max > config.maxPeople) issues.push('Invalid traveller pricing range.')
      for (let n = rule.min; n <= rule.max; n++) { if (covered.has(n)) issues.push('Traveller pricing ranges overlap.'); covered.add(n) }
    }
    if (pkg.status === 'published') {
      ready++
      if (publishing) {
        const duration = config.durations.find(d => d.id === offer.durationId)
        const tier = config.tiers.find(t => t.id === offer.tierId)
        if (!duration?.label.trim() || (offer.tierId && !tier?.name.trim()) || offer.stays.some(s => !s.name.trim() || !s.location.trim())) issues.push(`${pkg.label}: supply duration, tier and stay names before activation.`)
        const days = parseList<unknown>(pkg.itinerary)
        if (days.length !== pkg.days || days.some(d => { const r = daySchema.safeParse(d); return !r.success || !r.data.desc.trim() })) issues.push(`${pkg.label}: complete every itinerary day before activation.`)
        if (!pkg.priceOnRequest && pkg.priceAdult <= 0) issues.push(`${pkg.label}: enter a positive selling price or choose price on request.`)
      }
    }
  }
  if (publishing && (!config.durations.length || !ready)) issues.push('Activation requires a duration and at least one published offer.')
  if (publishing && config.defaultPackageSlug && !eligibleOffers(config, packages).some(o => o.pkg.slug === config.defaultPackageSlug)) issues.push('The default offer must be published and available.')
  return [...new Set(issues)]
}
export function discountPercent(selling: number, comparison: Offer['comparison']): number | null {
  if (!comparison?.approved || !comparison.evidence.trim() || comparison.price <= selling || selling < 0) return null
  const pct = Math.floor((comparison.price - selling) * 100 / comparison.price)
  return pct > 0 ? pct : null
}
export function quoteOffer(config: UniversalConfig, packages: UniversalPackage[], packageSlug: string, people: number, promoCode = '') {
  if (!Number.isInteger(people) || people < 1 || people > config.maxPeople) throw new Error(`Choose between 1 and ${config.maxPeople} travellers.`)
  const offer = config.offers.find(o => o.packageSlug === packageSlug)
  const pkg = packages.find(p => p.slug === packageSlug && p.status === 'published')
  if (!offer || !pkg) throw new Error('This offer is not available.')
  const normalized = promoCode.trim().toUpperCase()
  const promoApplied = !!normalized && !!offer.promo?.codes.some(c => c.toUpperCase() === normalized)
  if (normalized && !promoApplied) throw new Error('Invalid promo code.')
  const base = promoApplied ? offer.promo!.price : pkg.priceAdult
  const adjustmentBps = offer.rules.find(r => people >= r.min && people <= r.max)?.adjustmentBps ?? 0
  // Retain legacy operation ordering/rounding, including Andaman's per-person rounding.
  const factor = 1 + adjustmentBps / 10000
  const total = pkg.priceOnRequest ? null : offer.rounding === 'person' ? Math.round(base * factor) * people : Math.round(base * people * factor)
  const selling = total === null ? null : total / people
  const discount = selling === null ? null : discountPercent(selling, offer.comparison)
  return { packageId: pkg.id ?? null, packageSlug, people, total, perPerson: total === null ? null : total / people, selling, adjustmentBps, promoApplied, discount, comparisonPrice: discount === null ? null : offer.comparison!.price }
}
export function eligibleOffers(config: UniversalConfig, packages: UniversalPackage[]) {
  return config.offers.flatMap(o => { const p = packages.find(p => p.slug === o.packageSlug && p.status === 'published'); return p ? [{ offer: o, pkg: p }] : [] })
}
// Advertise regular per-person prices for the standard two-person basis, never promo/group minima.
export function startingPrice(config: UniversalConfig, packages: UniversalPackage[]): number | null {
  const prices = eligibleOffers(config, packages).filter(({ pkg }) => !pkg.priceOnRequest).map(({ offer }) => quoteOffer(config, packages, offer.packageSlug, Math.min(2, config.maxPeople)).perPerson!)
  return prices.length ? Math.min(...prices) : null
}

export function publicUniversal(config: UniversalConfig, packages: UniversalPackage[]): UniversalConfig {
  const offers = eligibleOffers(config, packages).map(({ offer: o }) => ({ ...o, comparison: o.comparison?.approved ? { ...o.comparison, evidence: 'Approved comparison' } : null }))
  return { ...config, durations: config.durations.filter(d => offers.some(o => o.durationId === d.id)), tiers: config.tiers.filter(t => offers.some(o => o.tierId === t.id)), offers }
}
