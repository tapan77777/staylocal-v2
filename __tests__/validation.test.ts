import { describe, it, expect } from 'vitest'
import {
  validateBooking,
  validateTripPackageInput,
  validatePackageArray,
} from '@/lib/validation'

const baseBooking = {
  name: 'Alice Example',
  phone: '+919876543210',
  tripSlug: 'darjeeling',
}

describe('validateBooking', () => {
  it('accepts a minimal valid booking', () => {
    const r = validateBooking(baseBooking)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.name).toBe('Alice Example')
      expect(r.data.people).toBe(2) // default
      expect(r.data.packageId).toBeNull()
    }
  })

  it('rejects a missing name', () => {
    const r = validateBooking({ ...baseBooking, name: '' })
    expect(r.ok).toBe(false)
  })

  it('rejects a bad phone', () => {
    const r = validateBooking({ ...baseBooking, phone: 'nope' })
    expect(r.ok).toBe(false)
  })

  it('rejects a bad email when provided', () => {
    const r = validateBooking({ ...baseBooking, email: 'not-an-email' })
    expect(r.ok).toBe(false)
  })

  it('rejects a missing trip slug', () => {
    const r = validateBooking({ ...baseBooking, tripSlug: '' })
    expect(r.ok).toBe(false)
  })

  it('rejects out-of-range people', () => {
    const low = validateBooking({ ...baseBooking, people: 0 })
    expect(low.ok).toBe(false)
    const high = validateBooking({ ...baseBooking, people: 99 })
    expect(high.ok).toBe(false)
  })

  it('rejects an invalid packageId', () => {
    const r = validateBooking({ ...baseBooking, packageId: -1 })
    expect(r.ok).toBe(false)
  })

  it('accepts a positive packageId', () => {
    const r = validateBooking({ ...baseBooking, packageId: 7 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.packageId).toBe(7)
  })

  it('ignores null / undefined packageId as unspecified', () => {
    const nullish = validateBooking({ ...baseBooking, packageId: null })
    expect(nullish.ok).toBe(true)
    if (nullish.ok) expect(nullish.data.packageId).toBeNull()
  })
})

const basePackage = {
  slug: '3d2n-standard',
  label: '3D/2N Standard',
  days: 3,
  nights: 2,
  priceAdult: 11999,
}

describe('validateTripPackageInput', () => {
  it('accepts a minimal valid package', () => {
    const r = validateTripPackageInput(basePackage)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.slug).toBe('3d2n-standard')
      expect(r.data.status).toBe('draft')
      expect(r.data.priceBasis).toBe('per adult, twin sharing')
      expect(r.data.priceOnRequest).toBe(false)
    }
  })

  it('allows publishing a zero-priced package when priceOnRequest is true', () => {
    const r = validateTripPackageInput({ ...basePackage, status: 'published', priceAdult: 0, priceOnRequest: true })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.priceOnRequest).toBe(true)
      expect(r.data.priceAdult).toBe(0)
      expect(r.data.status).toBe('published')
    }
  })

  it('rejects publishing a zero-priced package when priceOnRequest is false', () => {
    const r = validateTripPackageInput({ ...basePackage, status: 'published', priceAdult: 0, priceOnRequest: false })
    expect(r.ok).toBe(false)
  })

  it('coerces priceOnRequest "true" string into boolean true', () => {
    const r = validateTripPackageInput({ ...basePackage, priceOnRequest: 'true' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.priceOnRequest).toBe(true)
  })

  it('defaults to draft when status is omitted', () => {
    const r = validateTripPackageInput(basePackage)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.status).toBe('draft')
  })

  it('rejects publishing a zero-priced package', () => {
    const r = validateTripPackageInput({ ...basePackage, status: 'published', priceAdult: 0 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/₹0/)
  })

  it('allows saving a draft package with zero price', () => {
    const r = validateTripPackageInput({ ...basePackage, status: 'draft', priceAdult: 0 })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.priceAdult).toBe(0)
      expect(r.data.status).toBe('draft')
    }
  })

  it('rejects a missing label', () => {
    const r = validateTripPackageInput({ ...basePackage, label: '' })
    expect(r.ok).toBe(false)
  })

  it('rejects an invalid slug', () => {
    const r = validateTripPackageInput({ ...basePackage, slug: 'Not Valid!' })
    expect(r.ok).toBe(false)
  })

  it('rejects days < 1', () => {
    const r = validateTripPackageInput({ ...basePackage, days: 0 })
    expect(r.ok).toBe(false)
  })

  it('rejects nights < 0', () => {
    const r = validateTripPackageInput({ ...basePackage, nights: -1 })
    expect(r.ok).toBe(false)
  })

  it('rejects negative priceAdult', () => {
    const r = validateTripPackageInput({ ...basePackage, priceAdult: -100 })
    expect(r.ok).toBe(false)
  })

  it('rejects an unknown status', () => {
    const r = validateTripPackageInput({ ...basePackage, status: 'archived' })
    expect(r.ok).toBe(false)
  })

  it('replaces an invalid JSON itinerary with the default', () => {
    const r = validateTripPackageInput({ ...basePackage, itinerary: '{not json' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.itinerary).toBe('[]')
  })
})

describe('validatePackageArray', () => {
  it('accepts an empty array', () => {
    const r = validatePackageArray([])
    expect(r.ok).toBe(true)
  })

  it('accepts a null/undefined input as empty', () => {
    expect(validatePackageArray(undefined).ok).toBe(true)
    expect(validatePackageArray(null).ok).toBe(true)
  })

  it('rejects a non-array input', () => {
    const r = validatePackageArray({ foo: 1 })
    expect(r.ok).toBe(false)
  })

  it('rejects duplicate slugs', () => {
    const r = validatePackageArray([basePackage, basePackage])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/Duplicate/)
  })

  it('propagates the item index in validation errors', () => {
    const r = validatePackageArray([
      basePackage,
      { ...basePackage, slug: '4d3n-deluxe', days: 0 },
    ])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/Package 2/)
  })
})
