import { z } from 'zod'
import { safeImageUrl } from '@/lib/trip-schemas'

const text = z.string().trim().max(10000)
const short = z.string().trim().max(500)
const amount = z.number().int().min(1).max(10_000_000)
export const difficulties = ['Easy', 'Moderate', 'Difficult', 'Challenging'] as const
export const seasons = ['Winter', 'Spring', 'Summer', 'Monsoon', 'Autumn'] as const
export const departureStatuses = ['PLANNED', 'CONFIRMED', 'FULL', 'CLOSED', 'CANCELLED'] as const
export const mediaSchema = z.strictObject({ src: safeImageUrl, alt: short, caption: short.default('') })
export const stageSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/), title: short, description: text, campsite: short,
  mode: z.enum(['WALK', 'TRAVEL', 'REST']).default('WALK'),
  terrain: text.default(''), accommodation: text.default(''), meals: text.default(''),
  distanceKm: z.number().min(0).max(500).nullable(), walkingHours: z.number().min(0).max(24).nullable(),
  altitudeM: z.number().int().min(0).max(9000).nullable(),
  latitude: z.number().min(-90).max(90).nullable(), longitude: z.number().min(-180).max(180).nullable(),
  photos: z.array(mediaSchema).max(12).default([]),
}).refine(s => (s.latitude === null) === (s.longitude === null), 'Supply both latitude and longitude, or leave both empty.')
export const pricingOptionSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9-]{1,60}$/), label: short, description: text.default(''),
  status: z.enum(['draft', 'published']).default('draft'), sellingPrice: amount.nullable().default(null), priceVerified: z.boolean().default(false),
  pickup: short.default(''), drop: short.default(''), inclusions: z.array(short).max(50).default([]), exclusions: z.array(short).max(50).default([]),
  departureKeys: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(100).default([]),
}).refine(o => !o.priceVerified || o.sellingPrice !== null, 'A confirmed option needs a selling price.')
export const privatePricingSchema = z.array(z.strictObject({ optionKey: z.string().regex(/^[a-z0-9-]{1,60}$/), operatorNetRate: amount.nullable() })).max(20)
export const trekContentSchema = z.strictObject({
  version: z.literal(1), fixture: z.boolean().default(false), enquiryOnly: z.boolean().default(false), region: short, description: text,
  durationDays: z.number().int().min(1).max(30), difficulty: z.enum(difficulties).nullable(),
  maxAltitudeM: z.number().int().min(0).max(9000).nullable(), distanceKm: z.number().min(0).max(1000).nullable(),
  basecamp: short, pickup: short, drop: short, seasons: z.array(z.enum(seasons)).max(5), suitability: text,
  hero: mediaSchema, gallery: z.array(mediaSchema).max(40), highlights: z.array(short).max(12),
  routeOverview: text, stages: z.array(stageSchema).max(30),
  provisional: z.boolean().default(false),
  routeMap: z.strictObject({ image: mediaSchema, kind: z.enum(['CONCEPT', 'VERIFIED']).default('CONCEPT'), source: short.default(''), reviewedOn: z.iso.date().nullable().default(null) }).default({ image: { src: '', alt: '', caption: '' }, kind: 'CONCEPT', source: '', reviewedOn: null }),
  accommodation: text.default(''), meals: text.default(''), travelDetails: text.default(''),
  pricingOptions: z.array(pricingOptionSchema).max(20).default([]),
  routeVerification: z.strictObject({ verified: z.boolean(), source: short, reviewedOn: z.iso.date().nullable() }),
  inclusions: z.array(short).max(50), exclusions: z.array(short).max(50),
  preparation: z.strictObject({ fitness: text, weather: text, packing: z.array(short).max(80), altitude: text, terrain: text, emergency: text, safety: text, operatorVerified: z.boolean(), reviewedBy: short, reviewedOn: z.iso.date().nullable() }),
  faqs: z.array(z.strictObject({ q: short, a: text })).max(40),
  seo: z.strictObject({ title: z.string().trim().max(120), description: z.string().trim().max(350), socialImage: safeImageUrl }),
}).refine(c => new Set(c.stages.map(s => s.id)).size === c.stages.length, 'Stage identifiers must be unique.')
export const departureSchema = z.strictObject({
  id: z.string().max(80).optional(), key: z.string().regex(/^[a-z0-9-]{1,80}$/), startDate: z.iso.date(), endDate: z.iso.date(),
  status: z.enum(departureStatuses), priceAdult: amount.nullable(), capacity: z.number().int().min(1).max(200).nullable(), notes: short,
}).refine(d => d.endDate >= d.startDate, 'Departure end date must be on or after its start date.')
export const trekWriteSchema = z.strictObject({
  title: z.string().trim().min(1).max(200), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  summary: z.string().trim().max(1000), destination: short, startingPrice: amount.nullable(),
  status: z.enum(['draft', 'published']), content: trekContentSchema,
  privatePricing: privatePricingSchema.default([]), departures: z.array(departureSchema).max(100), expectedUpdatedAt: z.iso.datetime().optional(), publishConfirmed: z.boolean().default(false),
}).superRefine((t, ctx) => {
  const options = t.content.pricingOptions
  if (new Set(options.map(o => o.key)).size !== options.length) ctx.addIssue({ code: 'custom', message: 'Package option keys must be unique.' })
  const claimed = options.flatMap(o => o.departureKeys)
  if (new Set(claimed).size !== claimed.length || claimed.some(key => !t.departures.some(d => d.key === key))) ctx.addIssue({ code: 'custom', message: 'Each departure must belong to one existing option only.' })
  if (options.length && t.departures.some(d => !claimed.includes(d.key))) ctx.addIssue({ code: 'custom', message: 'Assign every departure to a package option.' })
  for (const o of options) for (const d of t.departures.filter(d => o.departureKeys.includes(d.key))) if (d.priceAdult !== null) ctx.addIssue({ code: 'custom', message: 'Clear legacy departure overrides and set the confirmed selling price on the package option.' })
  if (new Set(t.privatePricing.map(p => p.optionKey)).size !== t.privatePricing.length || t.privatePricing.some(p => !options.some(o => o.key === p.optionKey))) ctx.addIssue({ code: 'custom', message: 'Private costs must refer to unique existing package options.' })
}).refine(t => !t.content.enquiryOnly || t.startingPrice === null, 'Leave the starting price empty for an enquiry-only trek.').refine(t => new Set(t.departures.map(d => d.key)).size === t.departures.length, 'Departure keys must be unique.').refine(t => { const ids = t.departures.flatMap(d => d.id ? [d.id] : []); return new Set(ids).size === ids.length }, 'Departure IDs must be unique.')
export type PricingOption = z.infer<typeof pricingOptionSchema>
export type PrivatePricing = z.infer<typeof privatePricingSchema>
export type TrekContent = z.infer<typeof trekContentSchema>
export type TrekWrite = z.infer<typeof trekWriteSchema>
export type TrekDeparture = z.infer<typeof departureSchema>
export interface TrekRecord { id: number; packageId: number; title: string; slug: string; summary: string; destination: string; startingPrice: number | null; basePrice?: number | null; status: string; content: TrekContent; departures: TrekDeparture[]; options?: PublicTrekOption[]; updatedAt: string }

export interface PublicTrekOption extends PricingOption { packageId: number; departures: TrekDeparture[] }
export interface AdminTrekRecord extends TrekRecord { privatePricing: PrivatePricing }

export function emptyTrek(): TrekWrite {
  return { title: '', slug: '', summary: '', destination: '', startingPrice: null, status: 'draft', privatePricing: [], departures: [], publishConfirmed: false, content: {
    version: 1, fixture: false, enquiryOnly: false, region: '', description: '', durationDays: 1, difficulty: null, maxAltitudeM: null, distanceKm: null,
    provisional: false, pricingOptions: [], routeMap: { image: { src: '', alt: '', caption: '' }, kind: 'CONCEPT', source: '', reviewedOn: null }, accommodation: '', meals: '', travelDetails: '',
    basecamp: '', pickup: '', drop: '', seasons: [], suitability: '', hero: { src: '', alt: '', caption: '' }, gallery: [], highlights: [], routeOverview: '', stages: [],
    routeVerification: { verified: false, source: '', reviewedOn: null }, inclusions: [], exclusions: [],
    preparation: { fitness: '', weather: '', packing: [], altitude: '', terrain: '', emergency: '', safety: '', operatorVerified: false, reviewedBy: '', reviewedOn: null }, faqs: [], seo: { title: '', description: '', socialImage: '' },
  } }
}
export function hasNumericalRoute(c: TrekContent) {
  return c.maxAltitudeM !== null || c.distanceKm !== null || c.stages.some(s => s.altitudeM !== null || s.distanceKm !== null || s.walkingHours !== null || s.latitude !== null)
}
export function routeIsVerified(c: TrekContent) { return c.routeVerification.verified && !!c.routeVerification.source.trim() && !!c.routeVerification.reviewedOn }
export function trekPublicationProblems(t: TrekWrite): string[] {
  const c = t.content, p = c.preparation, problems: string[] = []
  if (c.provisional) problems.push('Resolve provisional content before publication.')
  if (c.fixture) problems.push('Design fixtures must remain drafts.')
  if (!t.summary || !t.destination || !c.region || !c.description) problems.push('Complete the summary, destination, region and description.')
  if (!c.enquiryOnly && !(c.pricingOptions.length ? c.pricingOptions.some(o => o.status === 'published' && o.priceVerified && o.sellingPrice !== null) : t.startingPrice)) problems.push('Enter an INR per-person starting price or explicitly select enquiry-only.')
  if (c.enquiryOnly && t.startingPrice !== null) problems.push('Leave the starting price empty for an enquiry-only trek.')
  if (!c.hero.src || !c.hero.alt) problems.push('Supply a hero photograph and descriptive alt text.')
  if (!c.difficulty || !c.basecamp || !c.pickup || !c.drop || !c.suitability) problems.push('Complete the difficulty, basecamp, pickup/drop and suitability facts.')
  if (c.stages.length !== c.durationDays || c.stages.some(s => !s.title || !s.description)) problems.push('Provide a title and description for every itinerary day, including travel/rest days.')
  if (!c.routeOverview || !c.inclusions.length || !c.exclusions.length) problems.push('Complete the route overview, inclusions and exclusions.')
  if (hasNumericalRoute(c) && !routeIsVerified(c)) problems.push('Verify numerical route facts against a named source and review date, or leave unknown values empty.')
  if (c.maxAltitudeM !== null && c.stages.some(s => s.altitudeM !== null && s.altitudeM > c.maxAltitudeM!)) problems.push('Maximum altitude cannot be below a documented stage altitude.')
  if ([...c.gallery, ...c.stages.flatMap(s => s.photos)].some(m => !m.src || !m.alt)) problems.push('Every supplied photo needs a URL and descriptive alt text.')
  if (!p.fitness || !p.weather || !p.packing.length || !p.altitude || !p.terrain || !p.emergency || !p.safety || !p.operatorVerified || !p.reviewedBy || !p.reviewedOn) problems.push('Complete preparation and safety details with an explicit operator review.')
  if (c.routeMap.image.src && !c.routeMap.image.alt) problems.push('Supply descriptive alt text for the route illustration.')
  if (c.routeMap.kind === 'VERIFIED' && (!c.routeMap.image.src || !c.routeMap.source || !c.routeMap.reviewedOn)) problems.push('A verified route image needs a source and review date.')
  if (c.routeMap.kind === 'VERIFIED' && /-concept\.svg(?:[?#]|$)/.test(c.routeMap.image.src)) problems.push('Original concept artwork must remain labelled as a design concept, not a verified route image.')
  if (c.pricingOptions.some(o => o.status === 'published' && (!o.label || !o.pickup || !o.drop || !o.inclusions.length || !o.exclusions.length))) problems.push('Complete each published package option and its arrangements.')
  if (c.faqs.some(f => !f.q || !f.a)) problems.push('Complete or remove unfinished FAQs.')
  const today = new Date().toISOString().slice(0, 10)
  if ((p.reviewedOn && p.reviewedOn > today) || (c.routeVerification.reviewedOn && c.routeVerification.reviewedOn > today) || (c.routeMap.reviewedOn && c.routeMap.reviewedOn > today)) problems.push('Review dates cannot be in the future.')
  return problems
}
export function todayInIndia() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }
export function departureIsEnquirable(d: TrekDeparture) { return d.status === 'CONFIRMED' && d.startDate >= todayInIndia() }

// Read-only advertising projection. The base/custom-date quote remains unchanged.
export function trekDisplayPrice(basePrice: number | null, departures: TrekDeparture[]) {
  const prices = [basePrice, ...departures.filter(departureIsEnquirable).map(d => d.priceAdult ?? basePrice)].filter((p): p is number => p !== null && p > 0)
  return { basePrice, startingPrice: prices.length ? Math.min(...prices) : null }
}

// Legacy version-1 content remains readable; new writes separate public and private data.
const storedTrekSchema = z.strictObject({ storageVersion: z.literal(2), content: trekContentSchema, privatePricing: privatePricingSchema })
export function decodeTrekConfig(raw: unknown): { content: TrekContent; privatePricing: PrivatePricing } {
  if (raw && typeof raw === 'object' && 'storageVersion' in raw) {
    const stored = storedTrekSchema.parse(raw)
    return { content: stored.content, privatePricing: stored.privatePricing }
  }
  return { content: trekContentSchema.parse(raw), privatePricing: [] }
}
export function optionPackageSlug(key: string) { return `trek-option-${key}` }
export function confirmedOptionPrice(option: PricingOption, enquiryOnly = false): number | null {
  return !enquiryOnly && option.status === 'published' && option.priceVerified && option.sellingPrice !== null ? option.sellingPrice : null
}
