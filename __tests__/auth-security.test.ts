import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import type { Session, User } from 'next-auth'
import type { CredentialsConfig } from 'next-auth/providers/credentials'

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), compare: vi.fn(), reserve: vi.fn(), clear: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }))
vi.mock('bcryptjs', () => ({ default: { hashSync: () => 'dummy-test-verifier', compare: mocks.compare } }))
vi.mock('@/lib/login-throttle', () => ({ reserveLoginAttempt: mocks.reserve, clearSuccessfulLoginAttempts: mocks.clear }))

import { authOptions } from '@/lib/auth'

const account = { id: 1, name: 'Staff', email: 'staff@example.test', password: 'test-verifier-before', role: 'admin' }
const config = authOptions.providers[0] as CredentialsConfig
const authorize = config.options!.authorize!
const jwt = authOptions.callbacks!.jwt!
const sessionCallback = authOptions.callbacks!.session!
const runToken = (token: JWT, user?: User) => jwt({ token, user, account: null } as Parameters<typeof jwt>[0])
const runSession = (token: JWT) => sessionCallback({
  session: { user: { name: 'Staff', email: 'staff@example.test' }, expires: '2099-01-01' }, token,
} as Parameters<typeof sessionCallback>[0])

beforeEach(() => {
  vi.resetAllMocks()
  mocks.findUnique.mockResolvedValue(account)
  mocks.compare.mockResolvedValue(true)
  mocks.reserve.mockReturnValue(true)
})

describe('credential authentication', () => {
  const login = (credentials = { email: account.email, password: 'test-password-input' }) => authorize(credentials, {} as Parameters<typeof authorize>[1])
  it('rejects credentials before database work when throttled', async () => {
    mocks.reserve.mockReturnValue(false)
    await expect(login()).rejects.toThrow('Too many sign-in attempts')
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
  it('uses a dummy comparison for unknown accounts', async () => {
    mocks.findUnique.mockResolvedValue(null)
    expect(await login()).toBeNull()
    expect(mocks.compare).toHaveBeenCalledWith('test-password-input', 'dummy-test-verifier')
  })
  it('rejects wrong passwords and unsupported roles', async () => {
    mocks.compare.mockResolvedValue(false)
    expect(await login()).toBeNull()
    mocks.compare.mockResolvedValue(true)
    mocks.findUnique.mockResolvedValue({ ...account, role: 'customer' })
    expect(await login()).toBeNull()
  })
  it('never returns the password verifier from authorize', async () => {
    const user = await login()
    expect(user).not.toHaveProperty('password')
    expect(JSON.stringify(user)).not.toContain(account.password)
    expect(mocks.clear).toHaveBeenCalledWith(account.email)
  })
  it('does not expose database exception details', async () => {
    mocks.findUnique.mockRejectedValue(new Error('private database context'))
    await expect(login()).rejects.toThrow('Sign-in is temporarily unavailable. Please retry.')
  })
  it('rejects oversized input without querying', async () => {
    expect(await login({ email: account.email, password: 'x'.repeat(1025) })).toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
})

describe('session invalidation and current permissions', () => {
  async function signInToken() {
    const user = await authorize({ email: account.email, password: 'test-password-input' }, {} as Parameters<typeof authorize>[1])
    return await runToken({}, user!)
  }
  it('refreshes roles from the database on every authenticated request', async () => {
    const token = await signInToken()
    mocks.findUnique.mockResolvedValue({ ...account, role: 'editor' })
    expect((await runToken(token)).role).toBe('editor')
  })
  it('rejects sessions after password changes', async () => {
    const token = await signInToken()
    mocks.findUnique.mockResolvedValue({ ...account, password: 'test-verifier-after' })
    const revoked = await runToken(token)
    expect(revoked).toEqual({})
    expect((await runSession(revoked) as Session).user).toBeUndefined()
  })
  it.each([null, { ...account, role: 'customer' }])('rejects removed or deauthorized accounts', async current => {
    const token = await signInToken()
    mocks.findUnique.mockResolvedValue(current)
    expect(await runToken(token)).toEqual({})
  })
  it('requires existing legacy sessions to sign in once', async () => {
    expect(await runToken({ id: '1', role: 'admin' })).toEqual({})
  })
  it('never exposes the internal credential tag or verifier in the browser session', async () => {
    const token = await signInToken()
    const session = await runSession(token)
    expect(session).toHaveProperty('user.role', 'admin')
    expect(JSON.stringify(session)).not.toContain('credentialTag')
    expect(JSON.stringify(session)).not.toContain(account.password)
  })
  it('fails closed on database errors', async () => {
    const token = await signInToken()
    mocks.findUnique.mockRejectedValue(new Error('unavailable'))
    await expect(runToken(token)).rejects.toThrow('unavailable')
  })
})
