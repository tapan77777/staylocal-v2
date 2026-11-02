import { cache } from 'react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AdminError } from '@/lib/admin-errors'
import { trekSystemEnabled, trekWritesEnabled, trekFixturesAllowed } from './flags'
import { trekContentSchema, trekWriteSchema, trekDisplayPrice, trekPublicationProblems, type TrekRecord, type TrekWrite } from './schema'

const include = { trip: true, package: true } as const
function asRecord(row: Prisma.TrekContentGetPayload<{ include: typeof include }>, departures: Awaited<ReturnType<typeof prisma.trekDeparture.findMany>>): TrekRecord {
  return { id: row.tripId, packageId: row.packageId, title: row.trip.title, slug: row.trip.slug, summary: row.trip.subtitle, destination: row.trip.location, startingPrice: row.package.priceOnRequest ? null : row.package.priceAdult, status: row.trip.status, content: trekContentSchema.parse(row.config), updatedAt: row.updatedAt.toISOString(), departures: departures.map(d => ({ id: d.id, key: d.key, startDate: d.startDate.toISOString().slice(0, 10), endDate: d.endDate.toISOString().slice(0, 10), status: d.status as TrekRecord['departures'][number]['status'], priceAdult: d.priceAdult, capacity: d.capacity, notes: d.notes })) }
}
export async function readAdminTrek(id: number): Promise<TrekRecord | null> {
  if (!trekSystemEnabled()) return null
  const classification = await prisma.tripClassification.findUnique({ where: { tripId: id } })
  if (classification?.kind !== 'TREK') return null
  const row = await prisma.trekContent.findUnique({ where: { tripId: id }, include })
  if (!row) return null
  return asRecord(row, await prisma.trekDeparture.findMany({ where: { tripId: id }, orderBy: { startDate: 'asc' } }))
}
export const getPublishedTreks = cache(async (): Promise<TrekRecord[]> => {
  if (!trekSystemEnabled()) return []
  const rows = await prisma.trekContent.findMany({ where: { trip: { status: 'published', classification: { kind: 'TREK' } }, package: { status: 'published' } }, include, orderBy: { updatedAt: 'desc' } })
  const ids = rows.map(r => r.tripId)
  const departures = ids.length ? await prisma.trekDeparture.findMany({ where: { tripId: { in: ids } }, orderBy: { startDate: 'asc' } }) : []
  return rows.map(r => asRecord(r, departures.filter(d => d.tripId === r.tripId))).filter(t => !t.content.fixture).map(t => t.content.enquiryOnly ? { ...t, startingPrice: null, basePrice: null, departures: [] } : { ...t, ...trekDisplayPrice(t.startingPrice, t.departures) })
})
export const getPublishedTrek = cache(async (slug: string) => (await getPublishedTreks()).find(t => t.slug === slug) ?? null)
export async function getClassifications(ids: number[]) {
  if (!trekSystemEnabled() || !ids.length) return []
  return prisma.tripClassification.findMany({ where: { tripId: { in: ids } } })
}
// Legacy JSON consumers do not render fixture warnings. Never expose test inventory there.
export async function publicInventoryOnly<T extends { id: number }>(trips: T[]): Promise<(T & { enquiryOnly?: boolean; priceOnRequest?: boolean })[]> {
  const kinds = new Map((await getClassifications(trips.map(t => t.id))).map(c => [c.tripId, c.kind]))
  if (![...kinds.values()].includes('TREK')) return trips
  const visible = new Map((await getPublishedTreks()).map(t => [t.id, t]))
  return trips.filter(t => kinds.get(t.id) !== 'TREK' || visible.has(t.id)).map(t => visible.get(t.id)?.content.enquiryOnly ? { ...t, enquiryOnly: true, priceOnRequest: true } : t)
}
export async function saveTrek(input: unknown, id?: number): Promise<TrekRecord> {
  if (!trekWritesEnabled()) throw new AdminError('Trek storage is not enabled for writing. Apply the reviewed upgrade to the intended database first.', 503)
  const parsed = trekWriteSchema.safeParse(input)
  if (!parsed.success) throw new AdminError(`Check ${parsed.error.issues[0]?.path.join('.')}: ${parsed.error.issues[0]?.message}`, 400)
  const data = parsed.data
  data.content.highlights = data.content.highlights.filter(Boolean)
  data.content.inclusions = data.content.inclusions.filter(Boolean)
  data.content.exclusions = data.content.exclusions.filter(Boolean)
  data.content.preparation.packing = data.content.preparation.packing.filter(Boolean)
  if (data.content.fixture && !trekFixturesAllowed()) throw new AdminError('Fixture content is restricted to the isolated local review database.', 403)
  if (data.status === 'published') {
    if (!data.publishConfirmed) throw new AdminError('Review and explicitly confirm this trek before publishing.', 409)
    const problems = trekPublicationProblems(data)
    if (problems.length) throw new AdminError(problems.join(' '), 422)
  }
  const tripId = await prisma.$transaction(async tx => {
    const old = id ? await tx.trekContent.findUnique({ where: { tripId: id }, include: { trip: { include: { classification: true } } } }) : null
    if (id && (!old || old.trip.classification?.kind !== 'TREK')) throw new AdminError('This record is not a dedicated trek. Existing trips need a reviewed classification migration.', 409)
    if (old && (!data.expectedUpdatedAt || old.updatedAt.toISOString() !== data.expectedUpdatedAt)) throw new AdminError('This trek changed since you opened it. Reload before saving.', 409)
    if (old && old.trip.slug !== data.slug) throw new AdminError('Existing public slugs are protected.', 409)
    if (old && trekContentSchema.parse(old.config).fixture && !data.content.fixture) throw new AdminError('Test fixtures cannot be promoted into real inventory. Create a separately reviewed real trek.', 409)
    const tripData = trekIdentity(data)
    const trip = old ? await tx.trip.update({ where: { id }, data: tripData }) : await tx.trip.create({ data: { ...tripData, slug: data.slug, type: 'enquiry', category: 'Trek' } })
    const packageData = { label: data.title, days: data.content.durationDays, nights: Math.max(0, data.content.durationDays - 1), priceAdult: data.startingPrice ?? 0, priceOnRequest: data.startingPrice === null, priceBasis: 'per person', status: data.status, image: data.content.hero.src, itinerary: JSON.stringify(data.content.stages.map((s, i) => ({ day: `Day ${i + 1}`, title: s.title, desc: s.description }))), inclusions: JSON.stringify(data.content.inclusions), exclusions: JSON.stringify(data.content.exclusions) }
    const pkg = old ? await tx.tripPackage.update({ where: { id: old.packageId }, data: packageData }) : await tx.tripPackage.create({ data: { ...packageData, tripId: trip.id, slug: 'trek-standard' } })
    await tx.tripClassification.upsert({ where: { tripId: trip.id }, create: { tripId: trip.id, kind: 'TREK' }, update: {} })
    await tx.trekContent.upsert({ where: { tripId: trip.id }, create: { tripId: trip.id, packageId: pkg.id, config: data.content as Prisma.InputJsonValue }, update: { config: data.content as Prisma.InputJsonValue } })
    const existing = await tx.trekDeparture.findMany({ where: { tripId: trip.id } })
    if (data.departures.some(d => d.id && !existing.some(e => e.id === d.id))) throw new AdminError('A departure does not belong to this trek.', 400)
    if (existing.some(d => !data.departures.some(next => next.id === d.id))) throw new AdminError('Existing departures cannot be removed. Mark them cancelled to preserve enquiry history.', 409)
    for (const d of data.departures) {
      const payload = { key: d.key, startDate: new Date(`${d.startDate}T00:00:00Z`), endDate: new Date(`${d.endDate}T00:00:00Z`), status: d.status, priceAdult: d.priceAdult, capacity: d.capacity, notes: d.notes }
      if (d.id) await tx.trekDeparture.update({ where: { id: d.id }, data: payload })
      else await tx.trekDeparture.create({ data: { ...payload, tripId: trip.id } })
    }
    return trip.id
  }, { isolationLevel: 'Serializable' })
  return (await readAdminTrek(tripId))!
}
function trekIdentity(t: TrekWrite) {
  return { title: t.title, subtitle: t.summary, location: t.destination, duration: `${t.content.durationDays} days`, difficulty: t.content.difficulty ?? '', price: t.startingPrice ?? 0, status: t.status, image: t.content.hero.src, gallery: JSON.stringify(t.content.gallery.map(m => m.src)), route: t.content.stages.map(s => s.campsite || s.title).join(' → '), highlights: JSON.stringify(t.content.highlights), included: JSON.stringify(t.content.inclusions), notIncluded: JSON.stringify(t.content.exclusions), faqs: JSON.stringify(t.content.faqs) }
}
