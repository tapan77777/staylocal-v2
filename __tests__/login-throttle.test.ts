import { describe, expect, it, vi } from 'vitest'

describe('bounded local login throttling', () => {
  async function freshLimiter() {
    vi.resetModules()
    return import('@/lib/login-throttle')
  }
  it('limits an account regardless of casing or whitespace', async () => {
    const { reserveLoginAttempt } = await freshLimiter()
    for (let i = 0; i < 5; i++) expect(reserveLoginAttempt('Staff@Example.test', 0)).toBe(true)
    expect(reserveLoginAttempt(' staff@example.test ', 0)).toBe(false)
  })
  it('expires an account window', async () => {
    const { reserveLoginAttempt } = await freshLimiter()
    for (let i = 0; i < 5; i++) reserveLoginAttempt('staff@example.test', 0)
    expect(reserveLoginAttempt('staff@example.test', 15 * 60_000)).toBe(true)
  })
  it('reserves slots synchronously to prevent parallel attempts bypassing the limit', async () => {
    const { reserveLoginAttempt } = await freshLimiter()
    const attempts = await Promise.all(Array.from({ length: 20 }, async () => reserveLoginAttempt('staff@example.test', 0)))
    expect(attempts.filter(Boolean)).toHaveLength(5)
  })
  it('clears account attempts after a successful login', async () => {
    const { reserveLoginAttempt, clearSuccessfulLoginAttempts } = await freshLimiter()
    for (let i = 0; i < 5; i++) reserveLoginAttempt('staff@example.test', 0)
    clearSuccessfulLoginAttempts('staff@example.test')
    expect(reserveLoginAttempt('staff@example.test', 0)).toBe(true)
  })
  it('caps attempts against changing email addresses per process', async () => {
    const { reserveLoginAttempt } = await freshLimiter()
    for (let i = 0; i < 100; i++) expect(reserveLoginAttempt(`staff${i}@example.test`, 0)).toBe(true)
    expect(reserveLoginAttempt('new@example.test', 0)).toBe(false)
    expect(reserveLoginAttempt('new@example.test', 60_000)).toBe(true)
  })
})
