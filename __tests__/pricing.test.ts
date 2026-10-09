import { describe, it, expect } from 'vitest'
import {
  calculatePackageTotal,
  clampPeople,
  formatInr,
  MAX_PEOPLE,
  MIN_PEOPLE,
} from '@/lib/pricing'

describe('clampPeople', () => {
  it('returns the integer unchanged inside range', () => {
    expect(clampPeople(2)).toBe(2)
    expect(clampPeople(10)).toBe(10)
  })

  it('clamps to MIN_PEOPLE for values below range', () => {
    expect(clampPeople(0)).toBe(MIN_PEOPLE)
    expect(clampPeople(-5)).toBe(MIN_PEOPLE)
  })

  it('clamps to MAX_PEOPLE for values above range', () => {
    expect(clampPeople(999)).toBe(MAX_PEOPLE)
    expect(clampPeople(MAX_PEOPLE + 1)).toBe(MAX_PEOPLE)
  })

  it('floors fractional input', () => {
    expect(clampPeople(2.9)).toBe(2)
    expect(clampPeople('3.5')).toBe(3)
  })

  it('falls back to MIN_PEOPLE for non-numeric input', () => {
    expect(clampPeople('abc')).toBe(MIN_PEOPLE)
    expect(clampPeople(null)).toBe(MIN_PEOPLE)
    expect(clampPeople(undefined)).toBe(MIN_PEOPLE)
    expect(clampPeople(NaN)).toBe(MIN_PEOPLE)
  })
})

describe('calculatePackageTotal', () => {
  it('multiplies price by people', () => {
    expect(calculatePackageTotal(10000, 2)).toBe(20000)
    expect(calculatePackageTotal(15999, 4)).toBe(63996)
  })

  it('returns 0 for a 0 price', () => {
    expect(calculatePackageTotal(0, 5)).toBe(0)
  })

  it('clamps negative price to 0', () => {
    expect(calculatePackageTotal(-500, 3)).toBe(0)
  })

  it('clamps people to MIN/MAX range', () => {
    expect(calculatePackageTotal(1000, 0)).toBe(1000)
    expect(calculatePackageTotal(1000, 100)).toBe(1000 * MAX_PEOPLE)
  })

  it('always returns an integer (never a float)', () => {
    const total = calculatePackageTotal(9999, 3)
    expect(Number.isInteger(total)).toBe(true)
  })

  it('handles string / junk price gracefully', () => {
    expect(calculatePackageTotal(NaN as unknown as number, 2)).toBe(0)
    expect(calculatePackageTotal('abc' as unknown as number, 2)).toBe(0)
  })
})

describe('formatInr', () => {
  it('formats with Indian grouping', () => {
    expect(formatInr(100000)).toBe('₹1,00,000')
    expect(formatInr(1500)).toBe('₹1,500')
  })

  it('handles 0', () => {
    expect(formatInr(0)).toBe('₹0')
  })

  it('clamps negatives to 0', () => {
    expect(formatInr(-500)).toBe('₹0')
  })
})
