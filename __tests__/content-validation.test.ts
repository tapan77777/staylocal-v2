import { describe, expect, it } from 'vitest'
import { validateTripInput, validateExperienceInput } from '@/lib/content-validation'
import { validatePackageArray, validateTripPackageInput } from '@/lib/validation'

const trip = { slug: 'test-trip', title: 'Test trip', location: 'India', category: 'Mountains', price: 10000, status: 'published' }
const pkg = { slug: 'standard', label: 'Standard', days: 3, nights: 2, priceAdult: 10000 }

describe('trip content validation', () => {
  it('accepts legacy empty optional fields without inventing content', () => {
    const result = validateTripInput(trip)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.duration).toBe('')
      expect(result.data.itinerary).toBe('[]')
    }
  })
  it.each(['title', 'location', 'category', 'slug'])('requires %s', key => {
    expect(validateTripInput({ ...trip, [key]: '' }).ok).toBe(false)
  })
  it.each([
    { price: -1 }, { price: 0 }, { price: 1.5 }, { price: '12oops' }, { price: 10_000_001 },
    { slug: '../admin' }, { slug: 'with space' }, { status: 'unknown' }, { type: 'unknown' }, { title: {} },
    { packages: { create: { id: 1 } }, id: 1 }, { createdAt: '2099-01-01' }, { packages: [], bookings: { deleteMany: {} } },
    { image: 'javascript:alert(1)' }, { image: '//untrusted.test/image.jpg' }, { image: '/\\untrusted.test/image.jpg' },
    { gallery: '[' }, { gallery: 'null' }, { gallery: '{}' }, { gallery: '[{}]' }, { gallery: '["data:text/html,bad"]' },
    { highlights: '[{}]' }, { included: 'null' }, { notIncluded: '{}' }, { durLabels: '[3]' }, { durSubLabels: 'true' },
    { faqs: '[{"q":{},"a":"answer"}]' }, { faqs: '[null]' },
    { itinerary: '[[null]]' }, { itinerary: '[{"day":"Day 1"}]' }, { itinerary: '[[{"day":"Day 1","title":{},"desc":""}]]' },
    { tierDetails: '[{"name":"Tier","vehicle":"","meals":"","feats":null}]' },
    { pricing: '{}' }, { pricing: '[[null]]' }, { pricing: '[[0]]' }, { pricing: '[[-1]]' },
    { gallery: JSON.stringify(['x'.repeat(100001)]) },
  ])('rejects invalid data: %j', override => expect(validateTripInput({ ...trip, ...override }).ok).toBe(false))

  it('accepts valid legacy pricing, itinerary, FAQs, and tiers', () => {
    expect(validateTripInput({ ...trip,
      gallery: '["/travel/test.jpg","https://images.example.test/test.jpg"]',
      pricing: '[[1000,2000]]', itinerary: '[[{"day":"Day 1","title":"Arrival","desc":"Transfer"}]]',
      tierDetails: '[{"name":"Standard","vehicle":"Car","meals":"Breakfast","feats":["Stay"]}]',
      faqs: '[{"q":"Question?","a":"Answer"}]',
    }).ok).toBe(true)
  })

  const tier = {
    name: 'Standard', subtitle: '', popular: false, hotels: { portblair: '', havelock: '', neil: '' }, ferry: '', meals: '', features: [],
    bufferPrice: [1000, 2000], price: [1000, 2000], promoPrice: [900, 1800], discount: [10, 10],
  }
  const andamanPricing = {
    durations: [{ label: '3D/2N', sub: '', image: '' }, { label: '4D/3N', sub: '', image: '' }],
    tiers: [tier, tier], promoCodes: [], promoDiscount: 2000,
  }
  it('accepts the existing Andaman pricing structure', () => {
    expect(validateTripInput({ ...trip, type: 'andaman', pricing: JSON.stringify(andamanPricing) }).ok).toBe(true)
  })
  it.each([
    [], null, {}, { ...andamanPricing, durations: [] }, { ...andamanPricing, tiers: [tier] },
    { ...andamanPricing, tiers: [tier, { ...tier, price: [1000] }] },
    { ...andamanPricing, tiers: [tier, { ...tier, hotels: null }] },
    { ...andamanPricing, promoDiscount: -1 },
  ])('rejects Andaman structures that would crash the dedicated page', pricing => {
    expect(validateTripInput({ ...trip, type: 'andaman', pricing: JSON.stringify(pricing) }).ok).toBe(false)
  })
})

describe('package validation', () => {
  it.each([
    { id: '7oops' }, { id: -1 }, { id: 2.5 }, { priceAdult: 12.5 }, { priceAdult: '12junk' },
    { nights: 3 }, { days: 0 }, { sortOrder: -1 }, { image: 'javascript:bad' }, { priceOnRequest: 'maybe' },
    { itinerary: 'null' }, { itinerary: '{}' }, { itinerary: '[null]' },
    { itinerary: '[{"day":"Day 1","title":"Arrival","desc":{}}]' },
    { inclusions: '[{}]' }, { exclusions: 'null' }, { tripId: 2 },
  ])('rejects invalid package %j', override => expect(validateTripPackageInput({ ...pkg, ...override }).ok).toBe(false))
  it('rejects duplicated IDs even when slugs differ', () => {
    expect(validatePackageArray([{ ...pkg, id: 1 }, { ...pkg, slug: 'other', id: 1 }]).ok).toBe(false)
  })
})

describe('experience validation', () => {
  const experience = { slug: 'test', title: 'Test', location: 'India' }
  it('accepts expected fields', () => expect(validateExperienceInput(experience).ok).toBe(true))
  it.each([null, [], { ...experience, id: 1 }, { ...experience, visited: 'true' }, { ...experience, status: 'unexpected' }, { ...experience, image: 'javascript:bad' }])('rejects invalid experience payloads', value => {
    expect(validateExperienceInput(value).ok).toBe(false)
  })
})
