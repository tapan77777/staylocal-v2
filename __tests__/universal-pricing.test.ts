import { describe, expect, it } from 'vitest'
import snapshots from './fixtures/legacy-trips.json'
import { andamanDays } from '../scripts/universal-source.mjs'
import { prepareLegacy } from '@/lib/legacy-universal'
import { discountPercent, quoteOffer, universalSchema, universalProblems, startingPrice, publicUniversal } from '@/lib/universal-trip'

const plans = snapshots.map(trip => ({ trip, ...prepareLegacy(trip, andamanDays()) }))
describe('exact legacy pricing parity from preserved public snapshot', () => {
  for (const plan of plans) it(`${plan.trip.slug}: all duration/tier/traveller/promo combinations`, () => {
    const { config } = plan
    const packages = plan.packages.map(p => ({ ...p, status: 'published' }))
    const prices = JSON.parse(plan.trip.pricing)
    for (const offer of config.offers) {
      const d = Number(offer.durationId.split('-')[1]) - 1
      const t = Number(offer.packageSlug.split('-t')[1]) - 1
      for (let people = 1; people <= config.maxPeople; people++) for (const promo of plan.trip.type === 'andaman' ? [false, true] : [false]) {
        const base = plan.trip.type === 'andaman' ? prices.tiers[t][promo ? 'promoPrice' : 'price'][d] : prices[d][t]
        const reduction = plan.trip.type === 'andaman' ? people === 1 ? -.15 : people <= 3 ? 0 : people <= 5 ? .05 : people <= 7 ? .1 : .15 : people >= 6 ? .1 : people >= 4 ? .05 : 0
        const expected = plan.trip.type === 'andaman' ? Math.round(base * (1 - reduction)) * people : Math.round(base * people * (1 - reduction))
        expect(quoteOffer(config, packages, offer.packageSlug, people, promo ? prices.promoCodes[0] : '').total).toBe(expected)
      }
    }
    expect(config.offers.every(o => !o.comparison?.approved)).toBe(true)
    expect(plan.packages.every(p => p.status === 'draft')).toBe(true)
  })
  it('does not mutate or invent legacy content', () => {
    const before = JSON.stringify(snapshots)
    snapshots.forEach(t => prepareLegacy(t, andamanDays()))
    expect(JSON.stringify(snapshots)).toBe(before)
    const darjeeling = plans.find(p => p.trip.slug === 'darjeeling')!
    expect(darjeeling.config.tiers).toEqual([])
    expect(darjeeling.packages.every(p => p.itinerary === '[]')).toBe(true)
    expect(darjeeling.blockers.length).toBeGreaterThan(0)
  })
})
const plan = plans.find(p => p.trip.slug === 'jibhi')!
const published = () => plan.packages.map(p => ({ ...p, status: 'published' }))
describe('universal pricing and publication', () => {
  it.each([0, -1, 1.5, 51, NaN])('rejects unsafe traveller count %s', people => expect(() => quoteOffer(plan.config, published(), plan.config.offers[0].packageSlug, people)).toThrow())
  it('rejects unpublished and foreign offers', () => {
    expect(() => quoteOffer(plan.config, plan.packages, plan.packages[0].slug, 2)).toThrow()
    expect(() => quoteOffer(plan.config, published(), 'foreign', 2)).toThrow()
  })
  it('returns no estimated amount for price-on-request', () => {
    const packages = published(); packages[0].priceOnRequest = true
    expect(quoteOffer(plan.config, packages, packages[0].slug, 2).total).toBeNull()
  })
  it('derives starting price from eligible regular offers, ignoring draft and promo prices', () => {
    expect(startingPrice(plan.config, published())).toBe(7500)
    expect(startingPrice(plan.config, plan.packages)).toBeNull()
    expect(startingPrice(plan.config, published().map(p => ({ ...p, priceOnRequest: true })))).toBeNull()
  })
  it('requires completed itinerary and valid ownership for activation', () => {
    expect(universalProblems(plan.config, published(), true)).toEqual([])
    expect(universalProblems(plan.config, [], true).join(' ')).toContain('outside this trip')
    const packages = published(); packages[0].itinerary = '[]'
    expect(universalProblems(plan.config, packages, true).join(' ')).toContain('itinerary')
  })
  it('rejects duplicate matrix cells and overlapping group rules', () => {
    const config = structuredClone(plan.config)
    config.offers.push(config.offers[0])
    config.offers[0].rules.push({ min: 4, max: 8, adjustmentBps: -500 })
    const problems = universalProblems(config, published(), true).join(' ')
    expect(problems).toContain('Duplicate offer')
    expect(problems).toContain('overlap')
  })
  it('validates the complete schema without allowing unexpected fields', () => {
    expect(universalSchema.safeParse(plan.config).success).toBe(true)
    expect(universalSchema.safeParse({ ...plan.config, privileged: true }).success).toBe(false)
  })
  it('keeps draft metadata and internal comparison evidence out of public props', () => {
    const config = structuredClone(plan.config)
    config.offers[0].comparison = { price: 10000, approved: true, evidence: 'internal-review-reference' }
    const visible = publicUniversal(config, [published()[0]])
    expect(visible.offers).toHaveLength(1)
    expect(JSON.stringify(visible)).not.toContain('internal-review-reference')
  })
})
describe('genuine comparison discounts', () => {
  it('requires approval, evidence and a higher comparison price', () => {
    expect(discountPercent(7500, { price: 10000, approved: true, evidence: 'approved-record' })).toBe(25)
    expect(discountPercent(7500, { price: 10000, approved: false, evidence: 'record' })).toBeNull()
    expect(discountPercent(7500, { price: 10000, approved: true, evidence: '' })).toBeNull()
    expect(discountPercent(7500, { price: 7500, approved: true, evidence: 'record' })).toBeNull()
    expect(discountPercent(7500, { price: 7000, approved: true, evidence: 'record' })).toBeNull()
    expect(discountPercent(7599, { price: 10000, approved: true, evidence: 'record' })).toBe(24)
  })
  it('refuses approved discounts with a surcharge that could exceed the comparison', () => {
    const andaman = plans.find(p => p.trip.slug === 'andaman')!
    const config = structuredClone(andaman.config); config.offers[0].comparison!.approved = true; config.offers[0].comparison!.evidence = 'record'
    expect(universalProblems(config, andaman.packages).join(' ')).toContain('surcharge')
  })
})
