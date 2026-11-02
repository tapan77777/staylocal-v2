import { describe, expect, it } from 'vitest'
import snapshots from './fixtures/legacy-trips.json'
import { publicTripSummary, durationDays, type SummaryTrip } from '@/lib/public-trip-summary'
import { prepareLegacy } from '@/lib/legacy-universal'
import { hasHimalayanWalks, isDedicatedTrek } from '@/lib/discovery'

const jibhi = { ...snapshots.find(t => t.slug === 'jibhi')!, packages: [] }
const pkg = (overrides = {}) => ({ slug: 'holiday', label: 'Holiday', days: 5, nights: 4, priceAdult: 14999, priceOnRequest: false, status: 'published', itinerary: '[]', accommodation: '', inclusions: '[]', exclusions: '[]', notes: '', image: '', ...overrides })
describe('public summaries preserve commercial data', () => {
  it('derives Jibhi from selectable prices and durations without mutating its legacy record', () => {
    const before = JSON.stringify(jibhi)
    expect(publicTripSummary(jibhi)).toMatchObject({ price: 7500, duration: '3D/2N', durationRange: '3–5 days', durationDays: 3, priceOnRequest: false })
    expect(JSON.stringify(jibhi)).toBe(before)
    expect(jibhi.price).toBe(15000)
  })
  it('derives Darjeeling without advertising inaccessible unnamed matrix columns', () => {
    const trip = { ...snapshots.find(t => t.slug === 'darjeeling')!, packages: [] }
    expect(publicTripSummary(trip)).toMatchObject({ price: 4999, durationDays: 3 })
    expect(publicTripSummary({ ...trip, pricing: '[[4999,1]]' }).price).toBe(4999)
  })
  it('pairs Andaman regular starting price with its actual starting duration, ignoring promos', () => {
    const trip = { ...snapshots.find(t => t.slug === 'andaman')!, packages: [] }
    expect(publicTripSummary(trip)).toMatchObject({ price: 18999, duration: '3N/4D', durationDays: 4, durationRange: '4–8 days' })
  })
  it('uses published packages over stale Trip values and excludes reserved or draft packages', () => {
    const trip = { ...jibhi, packages: [pkg({ status: 'draft', priceAdult: 1 }), pkg({ slug: 'universal-hidden', priceAdult: 2 }), pkg()] }
    expect(publicTripSummary(trip)).toMatchObject({ price: 14999, duration: '5 days · 4 nights', durationDays: 5 })
  })
  it('keeps price on request honest and selects the lowest real published price', () => {
    expect(publicTripSummary({ ...jibhi, packages: [pkg({ priceOnRequest: true })] }).priceOnRequest).toBe(true)
    expect(publicTripSummary({ ...jibhi, packages: [pkg({ priceOnRequest: true }), pkg({ priceAdult: 12000 })] }).price).toBe(12000)
  })
  it('retains the universal two-person quote basis and group surcharge arithmetic', () => {
    const plan = prepareLegacy(jibhi)
    const packages = plan.packages.map(p => ({ ...p, status: 'published' }))
    expect(publicTripSummary({ ...jibhi, packages }, plan.config).price).toBe(7500)
    const config = structuredClone(plan.config)
    config.offers = [config.offers[0]]
    config.offers[0].rules = [{ min: 1, max: 50, adjustmentBps: 1500 }]
    expect(publicTripSummary({ ...jibhi, packages }, config).price).toBe(8625)
  })
  it('does not advertise legacy duration rows the renderer cannot select', () => {
    expect(publicTripSummary({ ...jibhi, durLabels: '[]', pricing: '[[7500],[1]]' }).price).toBe(7500)
    expect(publicTripSummary({ ...jibhi, type: 'enquiry', pricing: '[[7500],[1]]' }).price).toBe(7500)
  })
  it('falls back conservatively for malformed optional legacy content', () => {
    const trip: SummaryTrip = { ...jibhi, pricing: 'bad', durLabels: 'bad' }
    expect(publicTripSummary(trip)).toMatchObject({ price: 15000, duration: '9D · 8N' })
  })
  it.each([['4N · 5D', 5], ['3D/2N', 3], ['5 days · 4 nights', 5], ['4-5', null]])('parses %s without mistaking nights for days', (label, days) => expect(durationDays(label as string)).toBe(days))
})
describe('non-destructive discovery policy', () => {
  it('does not turn every mountain holiday into a dedicated trek', () => {
    expect(isDedicatedTrek(jibhi)).toBe(false)
    expect(hasHimalayanWalks(jibhi)).toBe(true)
    expect(isDedicatedTrek({ category: 'Trekking' })).toBe(false)
    expect(isDedicatedTrek({ category: 'Mountains', productKind: 'TREK' })).toBe(true)
    expect(hasHimalayanWalks({ ...jibhi, highlights: '[]', itinerary: '[]' })).toBe(false)
  })
})
