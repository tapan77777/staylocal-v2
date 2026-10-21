import { describe, expect, it } from 'vitest'
import { encode, decode } from 'next-auth/jwt'
import { randomBytes } from 'node:crypto'

describe('real NextAuth encrypted JWT secret rotation', () => {
  it('accepts the current key and rejects a cookie encrypted with the retired key', async () => {
    // Ephemeral synthetic keys only. Never read environment secrets or log JWTs.
    const oldKey = randomBytes(32).toString('hex')
    const newKey = randomBytes(32).toString('hex')
    const oldCookie = await encode({ secret: oldKey, token: { id: '1', role: 'admin' } })
    expect((await decode({ secret: oldKey, token: oldCookie }))?.id).toBe('1')
    let rejected = false
    try { await decode({ secret: newKey, token: oldCookie }) } catch { rejected = true }
    expect(rejected).toBe(true)
    const currentCookie = await encode({ secret: newKey, token: { id: '1', role: 'admin' } })
    expect((await decode({ secret: newKey, token: currentCookie }))?.id).toBe('1')
    // Deliberately proves the old artifact/key STILL accepts the old cookie.
    expect((await decode({ secret: oldKey, token: oldCookie }))?.id).toBe('1')
  })
})
